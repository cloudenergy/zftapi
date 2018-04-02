'use strict';

const schedule = require('node-schedule');
const moment = require('moment');
const fp = require('lodash/fp');
const {monthlyBillNotification} = require('../services/v1.0/pushService');

const rule = new schedule.RecurrenceRule();
rule.second = 9;

exports.job = () => schedule.scheduleJob(rule, async () => {
    console.log(`Monthly user bills notifications, start from ${moment().format('YYYY-MM-DD hh:mm:ss')}`);
    const bills = await MySQL.Bills.findAll({
        where: {
            dueDate: {
                $lt: moment().unix()
            }
        }});
    console.log(`Overdue bills: ${fp.map(b => JSON.stringify(b.toJSON()))(bills)}`);
    fp.each(b => {
        const bill = b.toJSON();
        monthlyBillNotification(MySQL)(fp.defaults(bill)({userId: fp.get('user.id')(bill)}))
    })(bills);

});
