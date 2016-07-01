import _ = require('lodash');
import async = require('async');
import express = require('express');
import http_status = require('http-status');

import {ProductManager, ProductInterface, Product, ProductStatus} from 'productts';

import ExternalProductManager = require('./ExternalProductManager');
import ProductResponse = require('./ProductResponse');
import Permissions = require('../../permissions/Permissions');

class ProductController {
    //     path: "/v1/product/{id}",
    //     method: "POST",
    //     body: { name: false, current_price: false, status: false }
    public static create(req: express.Request, res: express.Response) {
        var id = req.params.id;
        if (Number.isNaN(+id)) {
            console.warn("Non-number product ID sent to create: " + id);
            return res.status(http_status.BAD_REQUEST).send(null);
        }

        var product_data: ProductInterface = new Product(<ProductInterface>req.body);
        product_data.gid = req.params.id;

        async.auto({
            external: (cb) => ExternalProductManager.findById(id, cb),
            permissions: (cb) => Permissions.canCreate(product_data, cb),
            product: (cb) => ProductManager.findById(id, { include_inactive: true }, cb),
            create: ['permissions', 'product', 'external', (cb, results) => {
                if (results.product) {
                    var error: any = new Error("Conflict");
                    error.status = http_status.CONFLICT;
                    return cb(error, null);
                }
                // Cache the external data here JFK
                product_data.name = product_data.name || ProductResponse.getDescriptionFromExternalResponse(results.external);
                ProductManager.create(product_data, cb);
            }],
            response: ['create', 'external', (cb, results) => cb(null, ProductResponse.formatProductResponse(results.create, results.external))]
        }, (err, results: any) => {
            if (err) {
                console.warn(err);
                return res.status(err.status || http_status.INTERNAL_SERVER_ERROR).send(null);
            }
            return res.json(results.response);
        });
    }

    //     path: "/v1/product/{id}",
    //     method: "GET",
    //     query: { include_inactive: false }
    public static findById(req: express.Request, res: express.Response) {
        var id = req.params.id;
        var include_inactive = req.query.include_inactive;

        async.auto({
            external: (cb) => ExternalProductManager.findById(id, cb),
            product: (cb) => ProductManager.findById(id, { include_inactive: include_inactive }, cb),
            permissions: ['product', (cb, results) => Permissions.canView(results.product, cb)],
            // hydrate: ['permissions', (cb, results) => ProductHydrator.hydrateProduct(results.product, cb)],
            response: ['permissions', 'external', (cb, results) => cb(null, ProductResponse.formatProductResponse(results.product, results.external))]
        }, (err, results: any) => {
            if (err) {
                console.warn(err);
                return res.status(err.status || http_status.NOT_FOUND).send(null);
            }

            if (!results.product) {
                return res.status(http_status.NOT_FOUND).send(null);
            }

            return res.json(results.response);
        });
    }

    //     path: "/v1/product/{id}",
    //     method: "PUT",
    //     body: { name: false, current_price: false, status: false }
    public static update(req: express.Request, res: express.Response) {
        var id = req.params.id;
        if (Number.isNaN(+id)) {
          console.warn("Non-number product ID sent to update: " + id);
            return res.status(http_status.NOT_FOUND).send(null);
        }
        var edits: {} = req.body;

        async.auto({
            product: (cb) => ProductManager.findById(id, { include_inactive: true }, cb),
            permissions: ['product', (cb, results) => Permissions.canEdit(results.product, cb)],
            update: ['permissions', (cb, results) => {
                if (!results.product) {
                    var error: any = new Error("Not Found");
                    error.status = http_status.NOT_FOUND;
                    return cb(error, null);
                }
                ProductManager.update(results.product, edits, cb);
            }]
        }, (err, results: any) => {
            if (err) {
                console.warn(err);
                return res.status(err.status || http_status.INTERNAL_SERVER_ERROR).send(null);
            }
            return res.json(null);
        });
    }
}
export = ProductController;
