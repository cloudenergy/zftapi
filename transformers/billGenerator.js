'use strict';
const moment = require('moment');

const generateForContract = contract => [{
	flow: 'receive',
	entityType: 'property',
	projectId: contract.projectId,
	contractId: contract.id,
	source: 'contract',
	type: 'rent',
	startDate: moment().subtract(2, 'month').unix(),
	endDate: moment().subtract(1, 'month').unix(),
	dueDate: moment().subtract(10, 'day').unix(),
	createdAt: moment().unix(),
	dueAmount: 12000,
	metadata: {}
}];

const extractBillItems = (contract, bill) => [{
	billId: bill.id,
	projectId: contract.projectId,
	configId: 123,
	amount: 10000,
	createdAt: moment().unix()
},{
	billId: bill.id,
	projectId: contract.projectId,
	configId: 124,
	amount: 11000,
	createdAt: moment().unix()
},{
	billId: bill.id,
	projectId: contract.projectId,
	configId: 125,
	amount: 12000,
	createdAt: moment().unix()
},{
	billId: bill.id,
	projectId: contract.projectId,
	configId: 126,
	amount: 13000,
	createdAt: moment().unix()
}];

module.exports = {
	generateForContract,
	extractBillItems
}