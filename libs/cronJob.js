'use strict';

const schedule = require('node-schedule');
const moment = require('moment');
const fp = require('lodash/fp');
const {
    overdueBillNotification,
    lowBalanceNotification,
    negativeBalanceNotification,
} = require('../services/v1.0/pushService');

const rule = new schedule.RecurrenceRule();
rule.hour = 8;
rule.minute = 0;

exports.job = () => schedule.scheduleJob(rule, async () => {
    console.log(`Daily user notifications process, start from ${moment().
        format('YYYY-MM-DD hh:mm:ss')}`);
    return Promise.all([
        billOverdue(),
        lowBalance(),
        negativeBalance(),
    ]);
});

const billOverdue = async () => {
    const bills = await MySQL.Bills.findAll({
        where: {
            dueDate: {
                $lt: moment().unix(),
            },
        },
    });
    console.log(`Overdue bill ids: ${fp.map(fp.get('dataValues.id'))(bills)}`);
    fp.each(b => {
        const bill = b.toJSON();
        overdueBillNotification(MySQL)(
            fp.defaults(bill)({userId: fp.get('user.id')(bill)}));
    })(bills);
};

const lowBalance = async () => {
    const balance = await MySQL.CashAccount.findAll({
        where: {
            balance: {
                $lt: 2000,
                $gte: 0,
            },
        },
    });
    console.log(
        `Low balance ids: ${fp.map(fp.get('dataValues.userId'))(balance)}`);
    fp.each(b => {
        const cashAccount = b.toJSON();
        lowBalanceNotification(MySQL)(cashAccount);
    })(balance);
};

const negativeBalance = async () => {
    const balance = await MySQL.CashAccount.findAll({
        where: {
            balance: {
                $lt: 0,
            },
        },
    });
    console.log(`Negative balance ids: ${fp.map(fp.get('dataValues.userId'))(
        balance)}`);
    fp.each(b => {
        const cashAccount = b.toJSON();
        negativeBalanceNotification(MySQL)(cashAccount);
    })(balance);
};

