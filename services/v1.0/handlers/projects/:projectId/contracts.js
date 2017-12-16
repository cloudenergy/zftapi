'use strict';
/**
 * Operations on /contracts
 */
const fp = require('lodash/fp');
const extractContract = require('../../../../../transformers/contractExtractor').extract;
const extractUser = require('../../../../../transformers/userExtractor').extract;
const generateBills = require('../../../../../transformers/billGenerator').generateForContract;
const billItems = require('../../../../../transformers/billGenerator').extractBillItems;

const filterFields = fp.identity;

module.exports = {
	/**
	 * summary: save contract
	 * description: save contract information

	 * parameters: body
	 * produces: application/json
	 * responses: 200, 400, 401, 406
	 */
	post: function createContract(req, res) {
		/**
		 * Get the data for response 200
		 * For response `default` status 200 is used.
		 */
		const Contracts = MySQL.Contracts;
		const Users = MySQL.Users;
		const Bills = MySQL.Bills;
		const BillFlows = MySQL.BillFlows;

		const sequelize = MySQL.Sequelize;

		const createBill = (contract, bill, t) => Bills.create(bill, {transaction: t})
			.then(dbBill => Promise.all(
				fp.map(bill => BillFlows.create(bill, {transaction: t}))(billItems(contract, dbBill))
				)
			);

		sequelize.transaction(t =>
			extractUser(req)
				.then(user => Users.create(user, {transaction: t}))
				.then(dbUser => extractContract(req, dbUser))
				.then(contract => Contracts.create(contract, {transaction: t}))
				.then(contract => Promise.all(
					fp.map(bill => createBill(contract, bill, t))(generateBills(contract)))
				)
		).then(results => res.send(201, ErrorCode.ack(ErrorCode.OK, {req: req.body, res: results})))
			.catch(err => res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC, err)));

	},
	get: function getContracts(req, res) {
		const Contracts = MySQL.Contracts;
		const Users = MySQL.Users;
		Contracts.findAll({include: [Users]})
			.then(filterFields)
			.then(contracts => res.send(contracts))
			.catch(err => res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC, err)));
	}
};