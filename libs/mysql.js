const Q = require('q');
const _  = require('underscore');
const Sequelize = require('sequelize');
const moment = require('moment');
const UUID = require('uuid');
const config = require('config');

let connection;
let pool;
let sequelizeInstance;

exports = module.exports = function(host, port, user, passwd, database, isReadOnly){
};

exports.Literal = (str)=>{
    return sequelizeInstance.literal(str);
};

exports.Load = function () {

    return new Promise((resolve, reject)=>{
        sequelizeInstance = new Sequelize(null, null, null, {
            dialect: 'mysql',
            replication:{
				read: [config.RDS],
				write: config.RDS
            },
            logging: false,
            timezone: "+08:00",
            retry:{
                max: 0
            },
            pool:{
                maxConnections: 20,
                minConnections: 5,
                maxIdleTime: 1000
            }
        });
        sequelizeInstance.authenticate().then(
            function (err) {
                log.info('RDS Connection Successful...');
                resolve();

                exports.Sequelize = sequelizeInstance;

                SequelizeDefine();
            }
        ).catch(function (err) {
            log.error(err);
            reject(err);
        });
    });
};

exports.Exec = function(sql, replacements)
{
    //
    if(!sql || !sql.length){
        return null;
    }

    //判断QueryTypes
    var queryTypes;
    {
        var blankIndex = sql.indexOf(" ");
        var types = sql.substr(0, blankIndex);
        switch(types){
            case "SELECT":
            case "select":
                queryTypes = Sequelize.QueryTypes.SELECT;
                break;
            case "UPDATE":
            case "update":
                queryTypes = Sequelize.QueryTypes.UPDATE;
                break;
            case "DELETE":
            case "delete":
                queryTypes = Sequelize.QueryTypes.DELETE;
                break;
            case "INSERT":
            case "insert":
                queryTypes = Sequelize.QueryTypes.INSERT;
                break;
            default:
                return null;
                break;
        }
    }

    var deferred = Q.defer();
    let options = {};
    if(replacements){
        options.replacements = replacements;
    }
    options.type = queryTypes;

    sequelizeInstance.query(sql, options).then(
        function (result) {
            deferred.resolve(result);
        }, function (err) {
            log.error(err, sql);
            deferred.resolve();
        }
    );

    return deferred.promise;
};

exports.ExecT = function(sql, t)
{
    //
    if(!sql || !sql.length){
        return null;
    }

    //判断QueryTypes
    var queryTypes;
    {
        var blankIndex = sql.indexOf(" ");
        var types = sql.substr(0, blankIndex);
        switch(types){
            case "SELECT":
            case "select":
                queryTypes = Sequelize.QueryTypes.SELECT;
                break;
            case "UPDATE":
            case "update":
                queryTypes = Sequelize.QueryTypes.UPDATE;
                break;
            case "DELETE":
            case "delete":
                queryTypes = Sequelize.QueryTypes.DELETE;
                break;
            case "INSERT":
            case "insert":
                queryTypes = Sequelize.QueryTypes.INSERT;
                break;
            default:
                return null;
                break;
        }
    }

    return sequelizeInstance.query(sql, { type: queryTypes, transaction: t});
};

function SequelizeDefine()
{
    const Entire = {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        projectId: {
            type: Sequelize.STRING(64),  //项目ID
            allowNull: false,
            defaultValue: ''
        },
        geoLocation: {
            type: Sequelize.BIGINT.UNSIGNED  //小区名称
            , allowNull: false
        },
        totalFloor: {
            type: Sequelize.INTEGER // 总层高
            , allowNull: false
            , defaultValue: 0
        },
        roomCountOnFloor: {
            type: Sequelize.INTEGER // 每层房间数
            , allowNull: false
            , defaultValue: 0
        },
        enabledFloors: {
            type: Sequelize.TEXT,   //房屋拥有配置
            get: function(){
                let enabledFloors;
                try{
                    enabledFloors = JSON.parse(this.getDataValue('enabledFloors'));
                }
                catch(e){
                    enabledFloors = {};
                }
                return enabledFloors;
            },
            set : function (value) {
                this.setDataValue('enabledFloors', JSON.stringify(value));
            }
        },
        createdAt: {
            type: Sequelize.BIGINT.UNSIGNED // 创建时间
            , allowNull: false
            , defaultValue: 0
        },
        deleteAt: {
            type: Sequelize.BIGINT.UNSIGNED // 删除时间
            , allowNull: false
            , defaultValue: 0
        },
        status: {
            type: Sequelize.STRING(10)  //房源状态
            , allowNull: false
            , defaultValue: 'open'
        },
        config: {
            type: Sequelize.TEXT,   //房屋拥有配置
            get: function(){
                let config;
                try{
                    config = JSON.parse(this.getDataValue('config'));
                }
                catch(e){
                    config = {};
                }
                return config;
            },
            set : function (value) {
                this.setDataValue('config', JSON.stringify(value));
            }
        },
    };
    const Soles = {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        projectId: {
            type: Sequelize.STRING(64),  //项目ID
            allowNull: false,
            defaultValue: ''
        },
        houseFormat:{
            type: Sequelize.STRING(8),
            allowNull: false
        },
        code: {
            type: Sequelize.STRING(10),  //编号
            allowNull: false,
            defaultValue: ''
        },
        geoLocation: {
            type: Sequelize.BIGINT.UNSIGNED  //小区名称
            , allowNull: false
        },
        layoutId:{
            type: Sequelize.BIGINT.UNSIGNED,
            defaultValue: 0
        },
        entireId: {
            type: Sequelize.BIGINT.UNSIGNED,
            defaultValue: 0
        },
        group: {
            type: Sequelize.STRING(10)  //团组名称(一期/香桂苑)
            , allowNull: false
            , defaultValue: ''
        },
        building: {
            type: Sequelize.STRING(10)  //门牌号
            , allowNull: false
            , defaultValue: ''
        },
        unit: {
            type: Sequelize.STRING(10)  //单元
            , allowNull: false
            , defaultValue: ''
        },
        roomNumber: {
            type: Sequelize.STRING(10)  //房号
            , allowNull: false
            , defaultValue: ''
        },
        currentFloor: {
            type: Sequelize.INTEGER // 所在层
            , allowNull: false
            , defaultValue: 0
        },
        totalFloor: {
            type: Sequelize.INTEGER // 总层高
            , allowNull: false
            , defaultValue: 0
        },
        houseKeeper:{
            type: Sequelize.BIGINT.UNSIGNED,
            defaultValue: 0
        },
        config: {
            type: Sequelize.TEXT,   //房屋拥有配置
            get: function(){
                let config;
                try{
                    config = JSON.parse(this.getDataValue('config'));
                }
                catch(e){
                    config = {};
                }
                return config;
            },
            set : function (value) {
                this.setDataValue('config', JSON.stringify(value));
            }
        },
        desc: {
            type: Sequelize.STRING  //描述
            , defaultValue: ''
        },
        status: {
            type: Sequelize.STRING(10)  //房源状态
            , allowNull: false
        },
        createdAt: {
            type: Sequelize.BIGINT.UNSIGNED // 创建时间
            , allowNull: false
            , defaultValue: 0
        },
        deleteAt: {
            type: Sequelize.BIGINT.UNSIGNED // 删除时间
            , allowNull: false
            , defaultValue: 0
        },
    };
    const Rooms = {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        projectId: {
            type: Sequelize.STRING(64),  //项目ID
            allowNull: false,
            defaultValue: ''
        },
        name: {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: ''
        },
        soleId: {
            type: Sequelize.BIGINT.UNSIGNED,
            defaultValue: 0
        },
        createdAt: {
            type: Sequelize.BIGINT.UNSIGNED // 创建时间
            , allowNull: false
            , defaultValue: 0
        },
        deleteAt: {
            type: Sequelize.BIGINT.UNSIGNED // 删除时间
            , allowNull: false
            , defaultValue: 0
        },
        desc: {
            type: Sequelize.STRING,  //描述
        },
        status: {
            type: Sequelize.STRING(10)  //状态
            , allowNull: false
            , defaultValue: 'open'
        },
        config: {
            type: Sequelize.TEXT,   //房屋拥有配置
            get: function(){
                let config;
                try{
                    config = JSON.parse(this.getDataValue('config'));
                }
                catch(e){
                    config = {};
                }
                return config;
            },
            set : function (value) {
                this.setDataValue('config', JSON.stringify(value));
            }
        }
    };

    const House = {
        id:{
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            primaryKey: true
        },
        projectId: {
            type: Sequelize.STRING(64),  //项目ID
            allowNull: false,
            defaultValue: ''
        },
        geoLocation: {
            type: Sequelize.BIGINT.UNSIGNED  //小区名称
            , allowNull: false
        },
        createdAt: {
            type: Sequelize.BIGINT.UNSIGNED // 创建时间
            , allowNull: false
            , defaultValue: 0
        },
        deleteAt: {
            type: Sequelize.BIGINT.UNSIGNED // 删除时间
            , allowNull: false
            , defaultValue: 0
        },
        status: {
            type: Sequelize.STRING(10)  //房源状态
            , allowNull: false
            , defaultValue: 'open'
        },
        config: {
            type: Sequelize.TEXT,   //房屋拥有配置
            get: function(){
                let config;
                try{
                    config = JSON.parse(this.getDataValue('config'));
                }
                catch(e){
                    config = {};
                }
                return config;
            },
            set : function (value) {
                this.setDataValue('config', JSON.stringify(value));
            }
        },
    };

    exports.Entire = sequelizeInstance.define('entire', Entire, {
        timestamps: false,
        freezeTableName: true
    });
    exports.Soles = sequelizeInstance.define('soles', Soles, {
        timestamps: false,
        freezeTableName: true
    });
    exports.Rooms = sequelizeInstance.define('rooms', Rooms, {
        timestamps: false,
        freezeTableName: true
    });

    //
    const Layouts = sequelizeInstance.define('layouts', {
        id: {
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true
        },
        instanceId: {
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: ''
        },
        bedRoom: {
            type: Sequelize.INTEGER,  // 室
            allowNull: false,
            defaultValue: 0
        },
        livingRoom: {
            type: Sequelize.INTEGER,  // 厅
            allowNull: false,
            defaultValue: 0
        },
        bathRoom: {
            type: Sequelize.INTEGER,  // 卫
            allowNull: false,
            defaultValue: 0
        },
        orientation: {
            type: Sequelize.STRING(2),  // 朝向
            allowNull: false,
            defaultValue: 'N'
        },
        roomArea: {
            type: Sequelize.INTEGER,  // 面积
            allowNull: false,
            defaultValue: 0
        },
        remark:{
            type: Sequelize.STRING(255),
            allowNull: false,
            defaultValue: ''
        }
    },{
        timestamps: false,
        freezeTableName: true
    });


    exports.Settings = sequelizeInstance.define('settings', {
        projectId: {
			type: Sequelize.BIGINT.UNSIGNED,
			allowNull: true // null 为 全局配置
        },
        group: {
            type: Sequelize.STRING(128),  //分组名
            allowNull: false,
            defaultValue: ''
        },
        key: {
            type: Sequelize.STRING,  //名称
            allowNull: false,
            defaultValue: ''
        },
        value: {
            type: Sequelize.STRING,  //值
            allowNull: false,
            defaultValue: ''
        },
    },{
        timestamps: false,
        freezeTableName: true
    });


    const Contracts = sequelizeInstance.define('contracts', {
        roomId: {
            type: Sequelize.BIGINT.UNSIGNED,     //房源ID
            allowNull: false,
            defaultValue: 0
        },
        userId: {
            type: Sequelize.BIGINT.UNSIGNED,     //用户ID
            allowNull: false,
            defaultValue: 0
        },
        from: {
            type: Sequelize.BIGINT.UNSIGNED,     //起租时间
            allowNull: false,
            defaultValue: 0
        },
        to: {
            type: Sequelize.BIGINT.UNSIGNED,     //到期时间
            allowNull: false,
            defaultValue: 0
        },
        strategy: {
            type: Sequelize.TEXT,   //付款方式
            get: function(){
                let strategy;
                try{
                    strategy = JSON.parse(this.getDataValue('strategy'));
                }
                catch(e){
                    strategy = {};
                }
                return strategy;
            },
            set : function (value) {
                this.setDataValue('strategy', JSON.stringify(value));
            }
        },
        expenses: {
            type: Sequelize.TEXT,   //加收费用
            get: function(){
                let expenses;
                try{
                    expenses = JSON.parse(this.getDataValue('expenses'));
                }
                catch(e){
                    expenses = {};
                }
                return expenses;
            },
            set : function (value) {
                this.setDataValue('expenses', JSON.stringify(value));
            }
        },
	    contractNumber: {
            type: Sequelize.STRING(50),      //合同号
            allowNull: false,
		    defaultValue: ''
        },
	    paymentPlan: {
            type: Sequelize.STRING(3),      //支付时间 (账单提前-02/账单固定+02/账单前一个月固定F03)
            allowNull: false
        },
	    signUpTime: {
            type: Sequelize.BIGINT.UNSIGNED,    //签约时间
            allowNull: false,
            defaultValue: 0
        }
    },{
        timestamps: false,
        freezeTableName: true
    });

	const Users = sequelizeInstance.define('users', {
		accountName: {
			type: Sequelize.STRING(32),     //账号
			allowNull: false,
			unique: true
		},
        name: {
			type: Sequelize.STRING(24),     //姓名
			allowNull: false
		},
		mobile: {
			type: Sequelize.STRING(13),     //手机
			allowNull: false
		},
		documentId: {
			type: Sequelize.TEXT,   //证件号
			allowNull: true
		},
		documentType: {
			type: Sequelize.INTEGER,   //证件类型
			allowNull: true,
			defaultValue: 1,
			validate: {
				max: 8,                  // 1 '身份证', 2 '护照', 3 '港澳通行证', 4 '台胞证', 5 '居住证', 6 '临时居住证', 7 '营业执照', 8 '其他证件'
				min: 1
			}
		},
		gender: {
			type: Sequelize.STRING(1),   //性别
			allowNull: false,
			defaultValue: 'M',
			validate: {
				isIn: [['M', 'F']]
			}
		},
	},{
		timestamps: false,
		freezeTableName: true
	});
	Contracts.belongsTo(Users);
	exports.Contracts = Contracts;
	exports.Users = Users;

	const GeoLocation = sequelizeInstance.define('location', {
        id:{
            type: Sequelize.BIGINT.UNSIGNED,
            primaryKey: true,
            autoIncrement: true
        },
        code: {
            type: Sequelize.STRING(12),
            allowNull: false,
            defaultValue: ''
        },
        divisionId: {
            type: Sequelize.BIGINT.UNSIGNED,     //区划 ID
            allowNull: false
        },
        district: {
            type:Sequelize.STRING(16),
            allowNull: false,
            defaultValue: ''
        },
        name: {
            type: Sequelize.STRING(16),     //查询结果名称
            allowNull: false
        },
        address: {
            type: Sequelize.STRING(32),     //查询结果地址
            allowNull: false
        },
        longitude: {
            type: Sequelize.DECIMAL(9,5),   //经纬度 seperate longitude latitude by ','
            allowNull: false
        },
        latitude: {
            type: Sequelize.DECIMAL(9,5),   //经纬度 seperate longitude latitude by ','
            allowNull: false
        }
	},{
		timestamps: false,
		freezeTableName: true
	});

	exports.GeoLocation = GeoLocation;

	exports.Division = sequelizeInstance.define('division', {
        name: {
			type: Sequelize.STRING,     //区划名称
			allowNull: false
		}
	},{
		timestamps: false,
		freezeTableName: true
	});

    exports.Bills = sequelizeInstance.define('bills', {
        flow: { //资金流向(收入/支出)
            type: Sequelize.STRING(10),
            allowNull: false,
            defaultValue: 'receive',
			validate: {
				isIn: [['pay', 'receive']]
			}
        },
        entity: { //实体类型(租客/业主/房源/其他)
            type: Sequelize.STRING(10),
            allowNull: false,
			defaultValue: 'tenant',
			validate: {
				isIn: [['tenant', 'landlord', 'house', 'other']]
			}
        },
        relativeID: {   //类型关联ID(租客/业主=>UDI,房源=>contractid)
            type: Sequelize.BIGINT.UNSIGNED,
            allowNull: false,
            defaultValue: 0
        },
		projectId: {    //项目ID
            type: Sequelize.STRING(64),
            allowNull: false
        },
        source: {   //来源
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        },
        type: {   //账单类型(expenseid)
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        },
        billFrom: {
            type: Sequelize.BIGINT.UNSIGNED,    //开始账期
            allowNull: false,
            defaultValue: 0
        },
        billTo: {
            type: Sequelize.BIGINT.UNSIGNED,    //结束账期
            allowNull: false,
            defaultValue: 0
        },
        paidAt: {
            type: Sequelize.BIGINT.UNSIGNED,    //支付日期
            allowNull: false,
            defaultValue: 0
        },
        amount: {   //金额 扩大100
            type: Sequelize.BIGINT.UNSIGNED
        },
        submitter: {
            type: Sequelize.BIGINT.UNSIGNED,    //提交人
            allowNull: false,
            defaultValue: 0
        },
        operator: {
            type: Sequelize.BIGINT.UNSIGNED,    //经办人
            allowNull: false,
            defaultValue: 0
        },
        timeCreate: {
            type: Sequelize.BIGINT.UNSIGNED,    //创建时间
            allowNull: false,
            defaultValue: 0
        },
        remark: {   //备注
            type: Sequelize.STRING(255),
            defaultValue: ''
        },
        metadata: {
            type: Sequelize.TEXT,   //对象信息（批次等）
            get: function(){
                let metadata;
                try{
                    metadata = JSON.parse(this.getDataValue('metadata'));
                }
                catch(e){
                    metadata = {};
                }
                return metadata;
            },
            set : function (value) {
                this.setDataValue('metadata', JSON.stringify(value));
            }
        }
    },{
        timestamps: false,
        freezeTableName: true
    });

    exports.BillFlows = sequelizeInstance.define('billflows', {
        flowid: {
            type: Sequelize.BIGINT.UNSIGNED,    //
            allowNull: false,
            defaultValue: 0
        },
        billid: {
            type: Sequelize.BIGINT.UNSIGNED,    // 账单ID
            allowNull: false,
            defaultValue: 0
        },
        projectid: {
            type: Sequelize.STRING(64),  //项目ID
            allowNull: false,
            defaultValue: ''
        },
        category: {
            type: Sequelize.BOOLEAN,    //
            allowNull: false,
            defaultValue: 0
        },
        relevantid: {
            type: Sequelize.STRING(64),  //根据来源相关的ID
            allowNull: false,
            defaultValue: ''
        },
        amount: {
            type: Sequelize.BIGINT.UNSIGNED,    //金额 扩大100
            allowNull: false,
            defaultValue: 0
        },
        paychannel: {
            type: Sequelize.BIGINT.UNSIGNED,    // 支付渠道
            allowNull: false,
            defaultValue: 0
        },
        operator: {
            type: Sequelize.BIGINT.UNSIGNED,    // 经办人
            allowNull: false,
            defaultValue: 0
        },
        flowfrom: {
            type: Sequelize.BIGINT.UNSIGNED,    // 流水起始
            allowNull: false,
            defaultValue: 0
        },
        flowto: {
            type: Sequelize.BIGINT.UNSIGNED,    // 流水截止
            allowNull: false,
            defaultValue: 0
        },
        timecreate: {
            type: Sequelize.BIGINT.UNSIGNED,    // 创建时间
            allowNull: false,
            defaultValue: 0
        },
        timedelete: {
            type: Sequelize.BIGINT.UNSIGNED,    // 删除时间
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: Sequelize.BOOLEAN,    //状态
            allowNull: false,
            defaultValue: 0
        }
    },{
        timestamps: false,
        freezeTableName: true
    });

    exports.Divisions = sequelizeInstance.define('divisions', {
        id: {
            type: Sequelize.INTEGER,    //
            primaryKey: true
        },
        title: {
            type: Sequelize.STRING(16),    // 账单ID
            allowNull: false,
            defaultValue: ''
        },
        level: {
            type: Sequelize.INTEGER(1),
            allowNull: false,
            defaultValue: 9
        },
        parent: {
            type: Sequelize.INTEGER(6),
            allowNull: false,
            defaultValue: 0
        },
        latitude:{
            type: Sequelize.DECIMAL(9, 5),
            allowNull: false,
            defaultValue: 0.0
        },
        longitude:{
            type: Sequelize.DECIMAL(9, 5),
            allowNull: false,
            defaultValue: 0.0
        },
        enable: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        }
    },{
        timestamps: false,
        freezeTableName: true
    });
    exports.Layouts = Layouts;
}


exports.GenerateFundID = function(uid)
{
    var now = moment();
    var timePrefix = now.format('YYYYMMDDHHmmss');   //14位时间
    var suffix = UUID.v4(uid+timePrefix).replace(/-/g, '');

    return timePrefix + suffix;
};

//获取数据表名称
exports.DataCollectionName = function (time)
{
    return "daily" + time.format("YYYYMM");
};
//获取计费日志表名称
exports.PaymentTableName = function (time)
{
    return "paymentlog"+ time.format("YYYYMM");
};

/*
 * 数组转换成 SQL 语句 IN 适用的
 * */
exports.GenerateSQLInArray = function(array)
{
    var idsArray = [];
    _.each(array, function (id) {
        idsArray.push("'"+id+"'");
    });
    return idsArray.toString();
};

/*
 * 组成SQL语句
 * */
exports.GenerateSQL = function(sql, queryArray)
{
    var sqlSentence = sql;
    if(queryArray.length){

        sqlSentence += " WHERE ";
        _.each(queryArray, function (query, index) {
            if(index){
                sqlSentence += " AND ";
            }
            sqlSentence += query;
        });
    }

    return sqlSentence;
};

/*
* 获取纯数据
* */
exports.Plain = function (data)
{
    return data.get({plain: true})
};

/*
* 获取能耗表
* */
exports.EnergyConsumptionTable = function(time)
{
    return "ecdaily"+time.format('YYYYMM');
};
/*
* 获取原始能耗
* */
exports.OriginEnergyConsumptionTable = function (time) {
    return "origindaily"+time.format('YYYYMM');
};
/*
 * 获取费用表
 * */
exports.CostTable = function(time)
{
    return "costdaily"+time.format('YYYYMM');
};

class Paging{
    constructor(area){
        this.area = area;
    }

    calc(paging){
        let lowerbound = (paging.pageindex-1) * paging.pagesize;
        let upperbound = lowerbound + paging.pagesize;
        let _this = this;
        let areaPaging = [];

        let i = 0;
        for(;i<_this.area.length;i++){
            let item = _this.area[i];
            const v = item.count;
            const k = item.key;

            upperbound -= v;
            if(lowerbound < v){
                const left = v - lowerbound;
                console.info(k, lowerbound, left);
                areaPaging.push({
                    key: k,
                    offset: lowerbound,
                    limit: left
                });
                if(left >= paging.pagesize){
                    return;
                }
                break;
            }
            lowerbound -= v;
        }
        i++;

        for(;i< _this.area.length&&upperbound;i++){
            let item = _this.area[i];
            const v = item.count;
            const k = item.key;
            if(upperbound < v){
                console.info(k, 0, upperbound);
                areaPaging.push({
                    key: k,
                    offset: 0,
                    limit: upperbound
                });
                break;
            }
            upperbound -= v;
            console.info(k, 0, v);
            areaPaging.push({
                key: k,
                offset: 0,
                limit: v
            });
        }

        return areaPaging;
    }
}

exports.QueryFundDetails = (fields, timeFrom, timeTo, where, paging, groupby, orderby)=>{
    return new Promise((resolve, reject)=>{
        //
        let tablename = (time)=>{
            return `funddetails${time.format('YYYYMM')}`;
        };

        if(!timeFrom.isValid() || !timeTo.isValid() ){
            return reject(ErrorCode.ack(ErrorCode.TIMETYPEERROR));
        }

        if(_.isArray(fields)){
            fields = fields.toString();
        }

        //paging info
        if(!paging || !paging.pageindex || !paging.pagesize ){
            return reject(ErrorCode.ack(ErrorCode.PARAMETERMISSED));
        }

        //get time
        if(!_.isArray(where)){
            return reject(ErrorCode.ack(ErrorCode.PARAMETERMISSED));
        }

        where.push(`timecreate between ${timeFrom.unix()} AND ${timeTo.unix()}`);


        let buildQuery = (tablePaging)=>{
            let queryArray = [];
            tablePaging.map(p=>{
                let sql = `select ${fields} from ${tablePaging.key} `;
                sql = MySQL.GenerateSQL(sql, where);
                if(groupby){
                    sql += ` group by ${groupby}`;
                }
                if(orderby){
                    sql += ` order by ${orderby} `;
                }
                sql += ` limit ${p.offset},${p.limit}`;
                log.info(sql);
                queryArray.push(MySQL.Exec(sql));
            });
            return queryArray;
        };
        let process = (allQuery)=>{
            Promise.all(allQuery).then(
                records=>{
                    let data = [];
                    records.map(rec=>{
                        rec.map(r=>{
                            data.push(r);
                        });
                    });

                    resolve(data);
                },err=>{
                    log.error(err);
                }

            );
        };
        if(timeFrom.format('YYYYMM') != timeTo.format('YYYYMM')){
            //跨表
            const tableA = tablename(timeFrom);
            const tableB = tablename(timeTo);
            const queryA = MySQL.GenerateSQL(`select count(id) as count from ${tableA}`, where);
            const queryB = MySQL.GenerateSQL(`select count(id) as count from ${tableB}`, where);

            Promise.all([
                MySQL.Exec(queryA),
                MySQL.Exec(queryB),
            ]).then(
                result=>{
                    let area = [
                        {key: tableA, count: result[0][0].count},
                        {key: tableA, count: result[0][0].count},
                    ];

                    let pagingObj = new Paging(area);
                    let areaSeg = pagingObj.calc(paging);

                    process( buildQuery(areaSeg) );
                }
            );
        }
        else{
            //未跨表
            let areaSeg = [
                {key: `funddetails${timeFrom.format('YYYYMM')}`, offset: paging.pageindex, limit: paging.pagesize}
            ];

            process( buildQuery(areaSeg) );
        }
    });
};

exports.PERMINUTE = 'PERMINUTE';
exports.PERDAY = 'PERDAY';
exports.PERWEEK = 'PERWEEK';
exports.PERMONTH = 'PERMONTH';
exports.PERYEAR = 'PERYEAR';