import _ = require('lodash');
import async = require('async');
import express = require('express');
import http_status = require('http-status');

import {UserManager, UserInterface, User, UserStatus} from 'yogats';

import UserResponse = require('./UserResponse');
import Permissions = require('../../permissions/Permissions');

class UserController {
    //     path: "/v1/user",
    //     method: "POST",
    //     body: { last_name: false, first_name: false, status: false }
    public static create(req: express.Request, res: express.Response) {
        var user_data: UserInterface = new User(<UserInterface>req.body);

        async.auto({
            permissions: (cb) => Permissions.canCreate(user_data, cb),
            create: ['permissions', (cb) => UserManager.create(user_data, cb)],
            response: ['create', (cb, results) => cb(null, UserResponse.formatUserResponse(results.create))]
        }, (err, results: any) => {
            if (err) {
                console.warn(err);
                return res.status(err.status || http_status.INTERNAL_SERVER_ERROR).send(null);
            }
            return res.json(results.response);
        });
    }

    //     path: "/v1/user/{id}",
    //     method: "GET",
    //     query: { include_inactive: false }
    public static findById(req: express.Request, res: express.Response) {
        var id = req.params.id;
        var include_inactive = req.query.include_inactive;

        async.auto({
            user: (cb) => UserManager.findById(id, { include_inactive: include_inactive }, cb),
            permissions: ['user', (cb, results) => Permissions.canView(results.user, cb)],
            // hydrate: ['permissions', (cb, results) => UserHydrator.hydrateUser(results.user, cb)],
            response: ['permissions', (cb, results) => cb(null, UserResponse.formatUserResponse(results.user))]
        }, (err, results: any) => {
            if (err) {
                console.warn(err);
                return res.status(err.status || http_status.NOT_FOUND).send(null);
            }

            if (!results.user) {
                return res.status(http_status.NOT_FOUND).send(null);
            }

            return res.json(results.response);
        });
    }

    //     path: "/v1/user/{id}",
    //     method: "PUT",
    //     body: { last_name: false, first_name: false, status: false }
    public static update(req: express.Request, res: express.Response) {
        var id = req.params.id;
        var edits: {} = req.body;

        async.auto({
            user: (cb) => UserManager.findById(id, { include_inactive: true }, cb),
            permissions: ['user', (cb, results) => Permissions.canEdit(results.user, cb)],
            update: ['permissions', (cb, results) => {
                if (!results.user) {
                    var error: any = new Error("Not Found");
                    error.status = http_status.NOT_FOUND;
                    return cb(error, null);
                }
                UserManager.update(results.user, edits, cb);
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
export = UserController;
