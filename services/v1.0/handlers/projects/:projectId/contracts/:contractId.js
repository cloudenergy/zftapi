'use strict';
/**
 * Operations on /contracts/:contractId
 */
const fp = require('lodash/fp');
const _ = require('lodash');
const moment = require('moment');
const assignNewId = require('../../../../common').assignNewId;
const omitSingleNulls = require('../../../../common').omitSingleNulls;
const innerValues = require('../../../../common').innerValues;
const jsonProcess = require('../../../../common').jsonProcess;
const finalBillOf = require('../../../../../../transformers/billGenerator').finalBill;
const finalPaymentOf = require('../../../../../../transformers/paymentGenerator').finalPayment;

const omitFields = item => _.omit(item, ['userId', 'createdAt', 'updatedAt']);
const translate = contract => _.flow(innerValues, omitSingleNulls, omitFields, jsonProcess)(contract);

module.exports = {
	get: function getContract(req, res) {
		const Contracts = MySQL.Contracts;
		const Users = MySQL.Users;
		Contracts.findById(req.params.contractId, {
			include: {model: Users}
		})
			.then(contract => {
				if (fp.isEmpty(contract)) {
					res.send(404);
					return;
				}
				res.send(translate(contract));
			});
	},
	delete: function (req, res) {
		const Contracts = MySQL.Contracts;
		Contracts.findById(req.params.contractId)
			.then(contract => {
				if (fp.isEmpty(contract)) {
					res.send(404);
					return;
				}
				contract.destroy().then(() => {
					res.send(204);
				})

			})
			.catch(err => res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC, {error: err.message})));
	},
	put: function operateContract(req, res) {
		const Contracts = MySQL.Contracts;
		const Rooms = MySQL.Rooms;
		const SuspendingRooms = MySQL.SuspendingRooms;
		const Bills = MySQL.Bills;
		const BillPayment = MySQL.BillPayment;
		const contractId = req.params.contractId;
		const projectId = req.params.projectId;
		const status = _.get(req, 'body.status', '').toUpperCase();
		const endDate = _.get(req, 'body.endDate');
		const roomStatus = _.get(req, 'body.roomStatus', Typedef.OperationStatus.IDLE).toUpperCase();

		if (status !== Typedef.ContractStatus.TERMINATED) {
			return res.send(400, ErrorCode.ack(ErrorCode.PARAMETERERROR, {
				status,
				allowedStatus: [Typedef.ContractStatus.TERMINATED]
			}));
		}
		const allowedStatus = [Typedef.OperationStatus.IDLE,
			Typedef.OperationStatus.PAUSED];
		if (!_.includes(allowedStatus, roomStatus)) {
			return res.send(400, ErrorCode.ack(ErrorCode.PARAMETERERROR, {roomStatus, allowedStatus}));
		}

		const Sequelize = MySQL.Sequelize;

		return Contracts.findById(contractId, {include: [{model: Rooms, required: true}]})
			.then(contract => {
				if (fp.isEmpty(contract)) {
					res.send(404);
					return;
				}

				return Sequelize.transaction(t => {
					const contractUpdating = contract.update({
						actualEndDate: _.isUndefined(endDate) ? Sequelize.col('to') : endDate,
						status
					}, {transaction: t});
					const suspending = assignNewId({
						projectId,
						from: endDate + 1,
						roomId: contract.dataValues.room.id
					});

					const settlement = fp.defaults(_.get(req, 'body.transaction'))({projectId, contractId});
					const newBill = assignNewId(finalBillOf(settlement));
					const finalBillPromise = Bills.create(newBill, {transaction: t});
					const operatorId = req.isAuthenticated() && req.user.id;
					const finalPayment = assignNewId(finalPaymentOf(fp.defaults(settlement)({billId: newBill.id, operatorId})));
					const finalPaymentPromise = BillPayment.create(finalPayment, {transaction: t});
					const operations = Typedef.OperationStatus.PAUSED === roomStatus ? [
						SuspendingRooms.create(suspending, {transaction: t})
					] : [];
					return Promise.all(_.concat(operations, [contractUpdating, finalBillPromise, finalPaymentPromise]));
				})
			}).then((updated, room) => res.send(updated))
			.catch(err => res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC, {error: err.message})));
	}
};
