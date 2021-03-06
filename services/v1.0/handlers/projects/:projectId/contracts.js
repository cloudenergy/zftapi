'use strict'
/**
 * Operations on /contracts
 */
const fp = require('lodash/fp')
const moment = require('moment')
const {extract: extractContract} = require(
  '../../../../../transformers/contractExtractor')
const {extract: extractUser, extractAuth} = require(
  '../../../../../transformers/userExtractor')
const {generate: generateBills} = require(
  '../../../../../transformers/billGenerator')
const billItems = require(
  '../../../../../transformers/billItemsGenerator').generate
const {
  omitSingleNulls, innerValues, assignNewId, singleRoomTranslate,
  jsonProcess, houseConnection, pickAuthAttributes, clearDeviceSharing,
} = require(
  '../../../common')
const {
  UsernameDuplicateError, RoomUnavailableError,
  ContractError, RoomNotExistError,
} = require('../../../../../libs/exceptions')
const {smsForNewContract} = require('../../../smsService')

const omitFields = fp.omit(
  ['createdAt', 'updatedAt', 'user.authId', 'user.auth'])
const roomTranslate = item => fp.defaults(item)(
  {room: singleRoomTranslate(item.room)})

const translate = (models, pagingInfo) => {
  const single = fp.pipe(innerValues, omitSingleNulls,
    jsonProcess, roomTranslate, pickAuthAttributes, omitFields)
  return {
    paging: {
      count: models.count,
      index: pagingInfo.index,
      size: pagingInfo.size,
    },
    data: fp.map(single)(models.rows),
  }
}

const generateOrder = Models => (field, order) => {
  const revisedOrder = fp.includes(order)(['DESC', 'ASC']) ? order : 'DESC'
  return field === 'balance' ?
    [
      Models.Users,
      {
        model: Models.CashAccount,
        as: 'cashAccount',
      },
      'balance',
      revisedOrder]
    :
    [
      'createdAt',
      revisedOrder]
}

const generateBalanceCondition = balance => {
  const revisedCondition = fp.includes(balance)(
    ['positive', 'negative', 'default'])
    ? balance : 'default'
  const conditionMap = {
    positive: {
      '$user.cashAccount.balance$': {
        $gt: 0,
      },
    },
    negative: {
      '$user.cashAccount.balance$': {
        $lt: 0,
      },
    },
  }
  return fp.getOr({})(revisedCondition)(conditionMap)
}

const generateQCondition = q => {
  const expression = {$regexp: decodeURIComponent(q)}
  return q ? {
    $or: [
      {'$room.house.building.location.name$': expression},
      {'$room.house.roomNumber$': expression},
      {'$room.house.code$': expression},
      {'$user.name$': expression},
      {'$user.auth.mobile$': expression},
    ],
  } : {}
}

const validateContract = async (contract) => {
  if (contract.from >= contract.to) {
    throw new ContractError(
      `Invalid contract time period : from ${contract.from} to ${contract.to}.`)
  }
  const standardRent = fp.getOr(0)('strategy.freq.rent')(contract)
  if (standardRent === 0) {
    throw new ContractError(
      `Invalid rent amount: ${standardRent}, it must be greater than 0.`)
  }

  const bond = fp.getOr(0)('strategy.bond')(contract)
  if (bond === 0) {
    throw new ContractError(
      `Invalid bond amount: ${bond}, it must be greater than 0.`)
  }
  const zeroExpense = fp.filter(expense => expense.rent === 0)(
    fp.getOr([])('expenses')(contract))
  if (!fp.isEmpty(zeroExpense)) {
    throw new ContractError(
      `Invalid expense amount of configId ${fp.map('configId')(
        zeroExpense)}, it must be greater than 0.`)
  }
  return contract
}
const conditionWhen = (now) => (status) => {
  const conditions = {
    'leasing': {
      from: {$lt: now},
      to: {$gt: now},
    },
    'overdue': {
      to: {$lt: now},
      status: Typedef.ContractStatus.ONGOING,
    },
    'waiting': {
      from: {$gt: now},
      status: Typedef.ContractStatus.ONGOING,
    },
  }
  return fp.getOr({})(`${status}`)(conditions)
}

module.exports = {
  /**
     * summary: save contract
     * description: save contract information

     * parameters: body
     * produces: application/json
     * responses: 200, 400, 401, 406
     */
  post: async function createContract(req, res) {
    /**
         * Get the data for response 200
         * For response `default` status 200 is used.
         */
    const Contracts = MySQL.Contracts
    const Projects = MySQL.Projects
    const Users = MySQL.Users
    const Auth = MySQL.Auth
    const Bills = MySQL.Bills
    const Rooms = MySQL.Rooms
    const BillFlows = MySQL.BillFlows
    const CashAccount = MySQL.CashAccount
    const {projectId} = req.params
    const sequelize = MySQL.Sequelize

    const createBill = (contract, bill, t) => Bills.create(
      assignNewId(bill), {transaction: t}).then(dbBill =>
      Promise.all(fp.map(billflow =>
        BillFlows.create(assignNewId(billflow), {transaction: t}))(
        billItems(contract, dbBill))))

    const validateUserAuth = async (user) => Auth.count({
      where: {
        username: user.username,
        id: {
          $ne: user.id,
        },
      },
    }).then(result => {
      log.info(`there are ${result} username ${user.username}`)
      if (result > 0) {
        throw new UsernameDuplicateError(
          `username ${user.username} already exists`)
      }
      return user
    })

    const checkRoomAvailability = async (contract, t) => {
      const {roomId, from, to} = contract
      return Promise.all([Contracts.count({
        where: {
          roomId,
          status: Typedef.ContractStatus.ONGOING,
          $or: [
            {
              from: {
                $lte: from,
              },
              to: {
                $gte: from,
              },
            }, {
              from: {
                $lte: to,
              },
              to: {
                $gte: to,
              },
            }],
        },
        transaction: t,
      }), Rooms.findById(roomId)]).then(([result, room]) => {
        if (fp.isEmpty(room)) {
          throw new RoomNotExistError(
            `room ${roomId} doesn't exist.`)
        }
        log.warn(`${result} room(s) under contract.`)
        if (result > 0) {
          throw new RoomUnavailableError(
            `room ${roomId} is unavailable.`)
        }
        return [contract, room]
      })
    }

    return sequelize.transaction(t =>
      extractAuth(req).
        then(validateUserAuth).
        then(auth => Auth.findOrCreate({
          where: {id: auth.id, username: auth.username},
          defaults: auth,
          transaction: t,
        }).then(fp.head)).
        then(auth => {
          const user = fp.defaults({authId: auth.id})(
            extractUser(req))
          return Users.findOrCreate({
            where: {authId: auth.id},
            defaults: user,
            transaction: t,
          }).then(fp.head).
            then(user => {
              return CashAccount.findOrCreate({
                where: {userId: user.id},
                defaults: assignNewId({userId: user.id}),
                transaction: t,
              }).then(() => user).
                then(dbUser => extractContract(req, dbUser).
                  then(
                    contract => validateContract(contract)).
                  then(
                    contract => checkRoomAvailability(
                      contract, t)).
                  then(([contract, room]) => Contracts.create(
                    assignNewId(contract),
                    {transaction: t}).then(c => [c, room])).
                  then(([contract, room]) => {
                    const bills = fp.map(
                      bill => createBill(contract, bill,
                        t))(
                      generateBills(contract))
                    console.log('room.houseId', room, room.houseId)
                    const clearSharing = clearDeviceSharing(
                      MySQL, t)(projectId, room.houseId)
                    return Promise.all(
                      fp.concat(bills, [clearSharing])).
                      then(() => [auth, contract])
                  }))
            })
        }),
    ).then(([userModel, contractModel]) => {
      const [user, contract] = fp.map(m => m.toJSON())(
        [userModel, contractModel])
      if (user.mobile) {
        Projects.findById(contract.projectId, {attributes: ['name']}).
          then(({name}) =>
            smsForNewContract(name, user.mobile, user.username))
      }
      return contract
    }).
      then(contract => res.send(201,
        ErrorCode.ack(ErrorCode.OK, {id: contract.id}))).
      catch(err => res.send(500,
        ErrorCode.ack(err.errorCode || ErrorCode.DATABASEEXEC,
          {error: err.message})))
  },
  get: async function getContracts(req, res) {
    const Contracts = MySQL.Contracts
    const Users = MySQL.Users
    const Auth = MySQL.Auth
    const CashAccount = MySQL.CashAccount
    const projectId = req.params.projectId
    const status = fp.getOr(Typedef.ContractStatus.ONGOING)(
      'params.status')(req).toUpperCase()
    const {
      manager, houseFormat, locationId, index: pageIndex, size: pageSize, order = 'DESC',
      orderField = 'default', balance = 'all', q,
    } = req.query
    const leasingStatus = fp.getOr('')('query.leasingStatus')(req).
      toLowerCase()
    const locationCondition = {'$room.house.building.location.id$': {$eq: locationId}}
    const pagingInfo = Util.PagingInfo(pageIndex, pageSize, true)
    const now = moment().unix()
    return Contracts.findAndCountAll({
      include: [
        {
          model: Users,
          required: true,
          include: [
            {
              model: CashAccount,
              as: 'cashAccount',
              attributes: ['balance'],
            },
            {
              model: Auth,
              attributes: ['id', 'username', 'mobile'],
            }],
        },
        houseConnection(MySQL)(houseFormat),
      ],
      distinct: true,
      where: fp.extendAll([
        {projectId, status},
        fp.isEmpty(locationId) ? {} : locationCondition,
        conditionWhen(now)(leasingStatus),
        manager ? {
          '$room.house.houseKeeper$': manager,
        } : {},
        generateBalanceCondition(balance),
        generateQCondition(q),
      ]),
      subQuery: false,
      offset: pagingInfo.skip,
      limit: pagingInfo.size,
      order: [
        generateOrder(MySQL)(orderField, order),
        ['createdAt', 'DESC'],
      ],
    }).
      then(data => translate(data, pagingInfo)).
      then(contracts => res.send(contracts)).
      catch(err => res.send(500,
        ErrorCode.ack(ErrorCode.DATABASEEXEC, {error: err.message})))
  },
}
