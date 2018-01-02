'use strict';

import {get, post} from '../../services/v1.0/handlers/projects/:projectId/credentials'
import 'include-node'
import {spy, match} from 'sinon'

describe('Environments', function () {
	before(() => {
		global.Typedef = Include('/libs/typedef');
		global.ErrorCode = Include('/libs/errorCode');
	});
	it('should return all credentials from findAll', async function () {
		const req = {
			params: {
				projectId: 100
			}
		};
		global.MySQL = {
			Auth: {
				async findAll() {
					return [];
				}
			}
		};
		const resSpy = spy();

		await get(req, {send: resSpy}).then(() =>
			resSpy.should.have.been.calledWith([])
		)
	});

	it('should omit id, createdAt, updatedAt, password fields', async function () {
		const req = {
			params: {
				projectId: 100
			}
		};
		global.MySQL = {
			Auth: {
				async findAll() {
					return [{dataValues: {id: 1, createdAt: 2, updatedAt: 3, password: '123', onlyMe: 'haha'}}];
				}
			}
		};
		const resSpy = spy();

		await get(req, {send: resSpy}).then(() =>
			resSpy.should.have.been.calledWith([{onlyMe: 'haha'}])
		)
	});

	it('should omit null value fields', async function () {
		const req = {
			params: {
				projectId: 100
			}
		};
		global.MySQL = {
			Auth: {
				async findAll() {
					return [{dataValues: {nullField1: null, nullField2: null, onlyMe: 'haha'}}];
				}
			}
		};
		const resSpy = spy();

		await get(req, {send: resSpy}).then(() =>
			resSpy.should.have.been.calledWith([{onlyMe: 'haha'}])
		)
	});

	it('should create auth if information are correct', async function () {
		const req = {
			isAuthenticated: () => true,
			params: {
				projectId: 100,
			},
			body: {
				username: 'username',
				level: 'MANAGER',
				password: 'somepass'
			},
			user: {
				level: 'ADMIN'
			}
		};
		global.MySQL = {
			Auth: {
				async create(body) {
					return body;
				}
			}
		};

		const resSpy = spy();

		await post(req, {send: resSpy}).then(() =>
			resSpy.should.have.been.calledWith(200, ErrorCode.ack(ErrorCode.OK, {username: req.body.username}))
		)
	});

	it('should return 400 if password is empty', function () {
		const req = {
			params: {
				projectId: 100,
			},
			body: {
				username: 'username',
				level: 'level'
			}
		};
		const resSpy = spy();

		post(req, {send: resSpy}).then(() =>
			resSpy.should.have.been.calledWith(400, ErrorCode.ack(ErrorCode.PARAMETERERROR, {error: "please provide md5 encrypted password"}))
		);
	});

});