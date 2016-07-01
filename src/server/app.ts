'use strict';
import _ = require("lodash");
import async = require("async");
import express = require('express');
import domain = require('domain');
import mongoose = require('mongoose');

// Here is where we would import config parameters and environmental variables
// config.addEnvironmentValues(require('./config/environment'));
// config.addEnvironmentValues(require('./config/environment/' + process.env.NODE_ENV + ".js"));

// Instead we will fake it with an inline JSON config object
var config = {
    server: {
        port: '8080',
        host: '127.0.0.1'
    },
    mongo: {
        setup: {
            server: {
                poolSize: 1
            },
            db: {
                safe: true
            }
        },
        debug: false,
        uri: 'mongodb://localhost/kirknet'
    }
}

require('source-map-support').install();

var app = express();
var server = null;

// Set node environment to development
process.env.NODE_ENV = 'development';

require('../config/express')(app);
require('../config/routes')(app);

// imports are finished. now begin starting up the app
async.auto({
    mongo: (cb) => startMongo(config.mongo, cb),
    server: ['mongo', (cb) => startServer(config.server, cb)]
}, function(err) {
        if (err) {
            console.warn(err);
        }
    });

function startMongo(mongoOptions, callback) {
    mongoose.connection.on('connected', function() {
        console.warn('Mongoose connection opened -> ' + mongoOptions.uri);
    });

    mongoose.connection.on('error', function(err) {
        console.warn('Mongoose connection error: ' + err);
    });

    mongoose.connection.on('disconnected', function() {
        console.warn('Mongoose connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function() {
        mongoose.connection.close(function() {
            console.warn('Mongoose connection disconnected through app termination');
            process.exit(0);
        });
    });

    if (mongoOptions.debug) {
        mongoose.set('debug', function(coll, method, query, doc, options) {
            query = query || {};
            options = options || {};
            console.warn('Mongoose: ' + coll + '.' + method + ' ' + JSON.stringify(query) + ' ' + JSON.stringify(options));
        });
    }

    mongoose.connect(mongoOptions.uri, mongoOptions.setup, callback);
}

function startServer(serverOptions, callback) {
    var serverDomain = domain.create();
    serverDomain.on('error', function(err) {
        server.close(); // stop taking new requests
    });
    serverDomain.run(function() {
        server = require('http').createServer(app);
    });

    // Start server
    server.listen(serverOptions.port, serverOptions.host, function() {
        console.warn('Startup Server -> ' + serverOptions.host + ":" + serverOptions.port);
    });

    process.nextTick(callback);
}

// Expose app
module.exports = app;
