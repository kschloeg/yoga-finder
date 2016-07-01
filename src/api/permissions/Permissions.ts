import _ = require('lodash');
import async = require('async');
import http_status = require('http-status');

class Permissions {
    public static canCreate(something:any, callback:(err, permissions:boolean) => void) {
      callback(null, true);
    }

    public static canView(something:any, callback:(err, permissions:boolean) => void) {
      callback(null, true);
    }

    public static canEdit(something:any, callback:(err, permissions:boolean) => void) {
      callback(null, true);
    }

    public static canEnterGodMode(something:any, callback:(err, permissions:boolean) => void) {
      var error:any = new Error("Forbidden");
      error.status = http_status.FORBIDDEN;
      callback(error, false);
    }
}
export = Permissions;
