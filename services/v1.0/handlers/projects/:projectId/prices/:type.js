'use strict';

const _ = require('lodash');
const fp = require('lodash/fp');
const moment = require('moment');

module.exports = {
    put: (req, res) => {

        (async()=>{
            const projectId = req.params.projectId;
            const type = req.params.type;

            const body = req.body;

            if(!Util.ParameterCheck(body,
                ['category', 'price']
            )){
                return res.send(422, ErrorCode.ack(ErrorCode.PARAMETERMISSED, {error: 'missing query params houseFormat'}));
            }

            const getHouseIds = async()=>{

                const where = _.assign(
                    {
                        projectId: projectId,
                        status: {$ne: Typedef.HouseStatus.DELETED},
                    },
                    body.houseIds ? {id:{$in: body.houseIds}} : {}
                );

                const houses = await MySQL.Houses.findAll({
                    where: where,
                    attributes: ['id']
                });

                return fp.map(house=>{return house.id;})(houses);
            };


            let t;
            try {
                const now = Number( moment().format('YYYYMMDD') );
                const houseIds = await getHouseIds();
                if(!houseIds.length){
                    return res.send(404, ErrorCode.ack(ErrorCode.HOUSEEXISTS))
                }
                const devicePrices = await MySQL.HouseDevicePrice.findAll({
                    where: {
                        houseId: {$in: houseIds},
                        projectId: projectId,
                        type: type,
                        category: body.category,
                        expiredDate: 0
                    }
                });

                //
                const updateIds = _.compact( fp.map(price => {
                    if( price.startDate === now ){
                        return price.id;
                    }
                    return null;
                })(devicePrices) );
                const updateHouseIds = _.compact( fp.map(price => {
                    if(price.startDate === now){
                        return price.houseId;
                    }
                    return  null;
                })(devicePrices) );


                const createHouseId = _.difference(houseIds, updateHouseIds);

                const createPrices = fp.map(id => {
                    return {
                        projectId: projectId,
                        houseId: id,
                        type: type,
                        category: body.category,
                        price: body.price,
                        startDate: now
                    };
                })(createHouseId);

                t = await MySQL.Sequelize.transaction({autocommit: false});

                await MySQL.HouseDevicePrice.update(
                    {
                        expiredDate: now
                    },
                    {
                        where: {
                            category: body.category,
                            projectId: projectId,
                            type: type,
                            houseId: {$in: createHouseId},
                            expiredDate: 0
                        },
                        transaction: t
                    }
                );

                await MySQL.HouseDevicePrice.update(
                    {
                        price: body.price
                    },
                    {
                        where:{
                            id: updateIds
                        },
                        transaction: t
                    }
                );

                await MySQL.HouseDevicePrice.bulkCreate(createPrices, {transaction: t});

                await t.commit();

                res.send(204);
            }
            catch(e){
                t.rollback();
                log.error(e, projectId, type, body);
                res.send(500, ErrorCode.ack(ErrorCode.DATABASEEXEC));
            }




        })();
    }
};
