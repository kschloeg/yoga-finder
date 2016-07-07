import _ = require('lodash');
import async = require('async');
import http_status = require('http-status');
import mongoose = require('mongoose');
import should = require('should');
import request = require('supertest');

import {UserManager, UserInterface, User, UserStatus} from 'yogats';

import UserResponse = require('./UserResponse');
import Permissions = require('../../permissions/Permissions');

var app: any = require("../../../server/app");

var user1 = new User({ last_name: "Schloegel", first_name: "Ramona" });
var user2_id = null;

function createTestData(done: () => any) {
    async.auto({
        user1: (cb) => UserManager.create(user1, cb)
    }, (err, results: any) => {
        should.not.exist(err);
        should.exist(results);
        should.exist(results.user1);
        user1.id = results.user1.id;
        done();
    });
}

function cleanUpTestData(done: () => any) {
    async.auto({
        user1: (cb) => UserManager.removeById(user1.id.toString(), cb),
        user2: (cb) => { if (user2_id) {UserManager.removeById(user2_id, cb)} else { cb(); }; }
    }, (err, results: any) => {
        should.not.exist(err);
        done();
    });
}

describe("User API", () => {
    beforeEach(done => {
        createTestData(done);
    });

    afterEach(done => {
        cleanUpTestData(done);
    });

    describe("GET /v1/user/{id}", () => {
        it("should respond the user data for a valid id", done => {
            var uri = "/v1/user/" + user1.id.toString();
            request(app)
                .get(uri)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(http_status.OK);
                    should.equal(user1.id, res.body.id);
                    done();
                });
        });

        it("should respond with Not Found for an invalid id", done => {
            var uri = "/v1/user/xzy";
            request(app)
                .get(uri)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(http_status.NOT_FOUND);
                    res.body.should.eql({});
                    done();
                });
        });
    });

    describe("PUT /v1/user/{id}", () => {
        it("should respond OK for a successful update", done => {
            var uri = "/v1/user/" + user1.id.toString();
            request(app)
                .put(uri)
                .send({ last_name: "S" })
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(http_status.OK);
                    request(app)
                        .get(uri)
                        .end((err, res) => {
                            should.not.exist(err);
                            res.status.should.eql(http_status.OK);
                            var response = res.body;
                            should.exist(response);
                            done();
                        });
                });
        });

        // it("should respond with Not Found for an invalid id", done => {
        //     var uri = "/v1/user/abc";
        //     request(app)
        //         .put(uri)
        //         .end((err, res) => {
        //             should.not.exist(err);
        //             res.status.should.eql(http_status.NOT_FOUND);
        //             res.body.should.eql({});
        //             done();
        //         });
        // });
    });

    describe("POST /v1/user", () => {
        it("should respond with the new user on success", done => {
            var uri = "/v1/user";
            request(app)
                .post(uri)
                .end((err, res) => {
                    should.not.exist(err);
                    should.exist(res.body);
                    res.status.should.eql(http_status.OK);
                    var response = res.body;
                    should.exist(response);
                    user2_id = response.id;
                    done();
                });
        });
    });
});
