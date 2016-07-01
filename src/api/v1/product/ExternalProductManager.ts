import _ = require("lodash");
import async = require('async');
import https = require('https');
import http = require('http');
import http_status = require('http-status');

class ExternalProductManager {
    private static DEFAULT_ID = '13860428';
    private static PLACEHOLDER_ID = 'PLACEHOLDER_ID';

    private static EXTERNAL_URL = 'https://api.target.com/products/v3/' + ExternalProductManager.PLACEHOLDER_ID + '?fields=descriptions&id_type=TCIN&key=43cJWpLjH8Z8oR18KdrZDBKAgLLQKJjz';
    public static findById(id: number, callback: (err, result: {}) => void) {
        if (!id) return callback(null, null);

        var buffer = '';
        var url = ExternalProductManager.EXTERNAL_URL.replace(ExternalProductManager.PLACEHOLDER_ID, id.toString());

        // TODO: Gracefully handle the case in which the http request hangs
        var req: http.ClientRequest = https.request(url, (message: http.IncomingMessage) => {
            if (!message) {
                return;
            }

            message.on('data', (data) => buffer = buffer.concat(data));
            message.on('end', (data) => {
                var response = {};
                try {
                    response = JSON.parse(buffer);
                } catch (err) { }

                if (!response['product_composite_response']) {
                    console.warn("Bad response from external resource");
                    callback(new Error("Bad response from external resource"), null);
                    return;
                }

                callback(null, response);
            });

        });

        req.on('error', ExternalProductManager.handleError);
        req.end();
    }

    private static handleError(err: any) {
        console.warn("ExternalProduct error: " + JSON.stringify(err));
    };
}

export = ExternalProductManager;
