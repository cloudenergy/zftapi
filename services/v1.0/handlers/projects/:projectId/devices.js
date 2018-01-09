'use strict';
/**
 * Operations on /houses
 */
const fp = require('lodash/fp');
const _ = require('lodash');
const moment = require('moment');
const common = Include("/services/v1.0/common");

module.exports = {
	/**
	 * summary: search houses
	 * description: pass hid or query parameter to get house list

	 * parameters: hfmt, community, searchkey, status, division, rooms, floors, housetype, offset, limit
	 * produces: application/json
	 * responses: 200, 400
	 */
	get: (req, res, next)=>{
		/**
		 * mode=FREE
		 */
        (async()=>{
            const projectId = req.params.projectId;
            const query = req.query;

            if(!Util.ParameterCheck(query,
                    ['mode']
                )){
                return res.send(422, ErrorCode.ack(ErrorCode.PARAMETERMISSED));
            }
            const mode = query.mode;
            if(mode !== 'FREE'){
                return res.send(422, ErrorCode.ack(ErrorCode.PARAMETERERROR));
            }

            const pagingInfo = Util.PagingInfo(query.index, query.size, true);

            const project = await MySQL.Projects.findOne({
                where:{
                    id: projectId
                },
            });
            if(!project){
                return res.send(404, ErrorCode.ack(ErrorCode.PROJECTNOTEXISTS));
            }
            const deviceIds = fp.map(device=>{
                return device.deviceId;
            })(await MySQL.HouseDevices.findAll({
                where:{
                    projectId: projectId,
                    endDate: 0
                },
                distinct: 'deviceId',
                attributes: ['deviceId']
            }));

            //
            const deviceQuery = _.assignIn(
                {
                    deviceId: {$nin: deviceIds}
                },
                query.q ? {$or:[
                    {name: new RegExp(query.q)},
                    {deviceType: new RegExp(query.q)},
                    {tag: new RegExp(query.q)}
                ]} : {}
            );
            try {
                const result = await Promise.all([
                    MongoDB.SensorAttribute
                        .count(deviceQuery),
                    MongoDB.SensorAttribute
                        .find(deviceQuery)
                        .skip(pagingInfo.skip)
                        .limit(pagingInfo.size)
                        .select('_id title')
                ]);
                const count = result[0];
                const devices = result[1];

                res.send(
                    {
                        paging: {
                            count: count,
                            index: pagingInfo.index,
                            size: pagingInfo.size
                        },
                        data: fp.map(device => {
                            return {
                                deviceId: device._id,
                                title: device.title,
                            }
                        })(devices)
                    }
                );
            }
            catch(err){
                log.error(err, projectId);
                res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC));
            }

        })();

        // if(!Typedef.IsHouseFormat(houseFormat)){
        //     return res.send(422, ErrorCode.ack(ErrorCode.PARAMETERERROR, 'houseFormat'));
        // }
        //
        //
        // const housesQuery = ()=> {
        //     switch (houseFormat) {
        //         case Typedef.HouseFormat.ENTIRE:
        //             return common.QueryEntire(projectId, query,
        //                 [
        //                     {
        //                         model: MySQL.HouseDevices,
        //                         as: 'Devices'
        //                     },
        //                 ]
        //             );
        //             break;
        //         default:
        //             break;
        //     }
        // };
        // housesQuery().then(
        //     data=>{
        //         res.send(data)
        //     },
        //     err=>{
        //         log.error(err, projectId, query);
        //         res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC));
        //     }
        // );
	}
};
