'use strict';

const {get, post} = require('../../services/v1.0/handlers/projects/:projectId/contracts');
require('include-node');
const {spy, stub} = require('sinon');
const fp = require('lodash/fp');

const room = {dataValues: {house: {dataValues: {building: {dataValues: {location: {dataValues: {}}}}}}}};
const expectedRoom = {
    building: undefined,
    group: undefined,
    houseId: undefined,
    id: undefined,
    locationName: undefined,
    roomName: undefined,
    roomNumber: undefined,
    unit: undefined,
    status: undefined
};
describe('Contracts', function () {
    before(() => {
        global.Typedef = Include('/libs/typedef');
        global.ErrorCode = Include('/libs/errorCode');
        global.Util = Include('/libs/util');
        global.SnowFlake = {next: fp.constant(1)};
    });
    it('should return all contracts from findAndCountAll', async function () {
        const contract = {dataValues: {expenses: '[]', strategy: '{}', room}};
        const req = {
            params: {
                projectId: 100
            },
            query: {}

        };
        global.MySQL = {
            Contracts: {
                async findAndCountAll() {
                    return {
                        count: 1,
                        rows: [contract]
                    };
                }
            }
        };
        const resSpy = spy();

        await get(req, {send: resSpy})
            .then(() => {
                resSpy.should.have.been.called;
                resSpy.getCall(0).args[0].data.should.be.eql([{expenses: [], strategy: {}, room: expectedRoom}]);
            });
    });

    it('should omit createdAt, updatedAt, userId fields', async function () {
        const req = {
            params: {
                projectId: 100
            },
            query: {}
        };
        global.MySQL = {
            Contracts: {
                async findAndCountAll() {
                    return {
                        count: 1,
                        rows: [{
                            dataValues: {
                                id: 1,
                                createdAt: 2,
                                updatedAt: 3,
                                userId: 123,
                                andMe: 'haha',
                                expenses: '[]',
                                strategy: '{}',
                                room
                            }
                        }]
                    };
                }
            }
        };
        const resSpy = spy();

        await get(req, {send: resSpy}).then(() => {
            resSpy.should.have.been.called;
            resSpy.getCall(0).args[0].data.should.be.eql([{
                id: 1,
                andMe: 'haha',
                expenses: [],
                strategy: {},
                room: expectedRoom
            }]);
        });
    });

    it('should omit null value fields', async function () {
        const req = {
            params: {
                projectId: 100
            },
            query: {}
        };
        global.MySQL = {
            Contracts: {
                async findAndCountAll() {
                    return {
                        count: 1,
                        rows: [{
                            dataValues: {
                                nullField1: null,
                                nullField2: null,
                                onlyMe: 'haha',
                                expenses: '[]',
                                strategy: '{}',
                                room
                            }
                        }]
                    };
                }
            }
        };
        const resSpy = spy();

        await get(req, {send: resSpy}).then(() => {
            resSpy.should.have.been.called;
            resSpy.getCall(0).args[0].data[0].onlyMe.should.be.eql('haha');
        });
    });

    it('should connect with houses if query with houseFormat', async function () {
        const req = {
            params: {
                projectId: 100
            },
            query: {
                houseFormat: 'SOLE'
            }
        };
        const sequelizeFindSpy = stub().resolves([]);
        const CashAccount = {id: 'CashAccount'};
        const Users = {id: 'Users'};
        const Rooms = {id: 'Rooms'};
        const Houses = {id: 'Houses'};
        const Building = {id: 'Building'};
        const GeoLocation = {id: 'GeoLocation'};
        global.MySQL = {
            Contracts: {
                findAndCountAll: sequelizeFindSpy
            },
            Users,
            Rooms,
            Houses,
            Building,
            GeoLocation,
            CashAccount
        };

        await get(req, {send: fp.noop}).then(() => {
            sequelizeFindSpy.should.have.been.called;
            const modelOptions = sequelizeFindSpy.getCall(0).args[0];
            modelOptions.include.should.be.eql([
                {
                    model: Users, 'required': true,
                    include: [
                        {
                            as: 'cashAccount',
                            attributes: ['balance'],
                            model: CashAccount
                        }
                    ]
                },
                {
                    model: Rooms,
                    required: true,
                    attributes: ['id', 'name'],
                    include: [{
                        model: Houses,
                        as: 'house',
                        attributes: ['id', 'roomNumber'],
                        where: {
                            houseFormat: 'SOLE'
                        },
                        include: [{
                            as: 'building',
                            attributes: [
                                'building',
                                'unit'
                            ],
                            include: [{
                                as: 'location',
                                attributes: [
                                    'name'
                                ],
                                model: GeoLocation,
                            }],
                            model: Building,
                        }]
                    }]
                }]);
        });
    });

    it('should check room availability while creating contract', async function () {
        const req = {
            params: {
                projectId: 100
            },
            body: {
                from: 1000,
                to: 2000,
                user: {},
                roomId: 321,
            }
        };
        const sequelizeCountSpy = stub().resolves([]);
        const Users = {id: 'Users', findOrCreate: async () => [{id: 1999}]};
        const CashAccount = {findOrCreate: async () => ([{id: 321, userId: 1999}])};
        const Houses = {id: 'Houses'};
        const Building = {id: 'Building'};
        const GeoLocation = {id: 'GeoLocation'};
        const Rooms = {id: 'Rooms'};
        global.MySQL = {
            Contracts: {
                count: sequelizeCountSpy,
                create: async () => ({})
            },
            CashAccount,
            Users,
            Rooms,
            Houses,
            Building,
            GeoLocation,
            Sequelize: {
                transaction: async func => func({})
            }
        };

        await post(req, {send: fp.noop}).then(() => {
            sequelizeCountSpy.should.have.been.called;
            const countingOption = sequelizeCountSpy.getCall(0).args[0];
            countingOption.where.should.be.eql({
                roomId: req.body.roomId,
                status: 'ONGOING',
                $or: [{
                    from: {
                        $lte: req.body.from
                    },
                    to: {
                        $gte: req.body.from
                    }
                }, {
                    from: {
                        $lte: req.body.to
                    },
                    to: {
                        $gte: req.body.to
                    }
                }]
            });
        });
    });

    it('should check from is less than to while creating contract', async function () {
        const req = {
            params: {
                projectId: 100
            },
            body: {
                from: 2000,
                to: 1000,
                user: {accountName: ''},
            }
        };

        const Users = {id: 100, findOrCreate: async () => [{id: 1999}]};
        const CashAccount = {findOrCreate: async () => ([{id: 321, userId: 1999}])};
        const Rooms = {id: 0};
        const Houses = {id: 1};
        const Building = {id: 2};
        const GeoLocation = {id: 3};
        global.MySQL = {
            Contracts: {},
            CashAccount,
            Users,
            Rooms,
            Houses,
            Building,
            GeoLocation,
            Sequelize: {
                transaction: async func => func({})
            }
        };
        const resSpy = spy();
        await post(req, {send: resSpy}).then(() => {
            resSpy.should.have.been.called;
            resSpy.getCall(0).args[0].should.be.eql(500);
            resSpy.getCall(0).args[1].result.should.be.eql({'error': 'Invalid contract time period : from 2000 to 1000.'});
        });
    });
});