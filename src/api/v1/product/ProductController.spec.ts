import _ = require('lodash');
import async = require('async');
import http_status = require('http-status');
import mongoose = require('mongoose');
import should = require('should');
import request = require('supertest');

import {ProductManager, ProductInterface, Product, ProductStatus} from 'productts';

import ExternalProductManager = require('./ExternalProductManager');
import ProductResponse = require('./ProductResponse');
import Permissions = require('../../permissions/Permissions');

var app: any = require("../../../server/app");

var product1 = new Product({ gid: 13860420, current_price: { value: 3.99, currency_code: "USD" } });
var product2_id = '12345678';

function createTestData(done: () => any) {
    async.auto({
        product1: (cb) => ProductManager.create(product1, cb)
    }, (err, results: any) => {
        should.not.exist(err);
        should.exist(results);
        should.exist(results.product1);
        done();
    });
}

function cleanUpTestData(done: () => any) {
    async.auto({
        product1: (cb) => ProductManager.removeById(product1.gid.toString(), cb),
        product2: (cb) => ProductManager.removeById(product2_id, cb)
    }, (err, results: any) => {
        should.not.exist(err);
        done();
    });
}

describe("Product API", () => {
    beforeEach(done => {
        createTestData(done);
    });

    afterEach(done => {
        cleanUpTestData(done);
    });

    describe("GET /v1/product/{id}", () => {
        it("should respond the product data for a valid id", done => {
            var uri = "/v1/product/" + product1.gid.toString();
            request(app)
                .get(uri)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(http_status.OK);
                    should.equal(product1.gid, res.body.id);
                    done();
                });
        });

        it("should respond with Not Found for an invalid id", done => {
            var uri = "/v1/product/xzy";
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

    describe("PUT /v1/product/{id}", () => {
        it("should respond OK for a successful update", done => {
            var uri = "/v1/product/" + product1.gid.toString();
            request(app)
                .put(uri)
                .send({ current_price: { value: 0, currency_code: "USD" } })
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(http_status.OK);
                    request(app)
                        .get(uri)
                        .end((err, res) => {
                            should.not.exist(err);
                            res.status.should.eql(http_status.OK);
                            var response = res.body;
                            should.equal(product1.gid, response.id);
                            should.equal('0', response.current_price.value);
                            done();
                        });
                });
        });

        it("should respond with Not Found for an invalid id", done => {
            var uri = "/v1/product/abc";
            request(app)
                .put(uri)
                .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.eql(http_status.NOT_FOUND);
                    res.body.should.eql({});
                    done();
                });
        });
    });

    describe("POST /v1/product/{id}", () => {
        it("should respond with the new product on success", done => {
            var uri = "/v1/product/" + product2_id;
            request(app)
                .post(uri)
                .end((err, res) => {
                    should.not.exist(err);
                    should.exist(res.body);
                    res.status.should.eql(http_status.OK);
                    should.equal(product2_id, res.body.id);
                    done();
                });
        });
    });

    it("should respond with a CONFLICT status when a gid already exists in the DB", done => {
        var uri = "/v1/product/" + product1.gid.toString();
        request(app)
            .post(uri)
            .end((err, res) => {
                should.not.exist(err);
                res.body.should.eql({});
                res.status.should.eql(http_status.CONFLICT);
                done();
            });
    });
});
