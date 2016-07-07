import _ = require('lodash');

import {UserInterface} from "yogats";

class UserResponse {
    public static formatUserResponse(user:UserInterface, options?:{include_status:boolean}) {
        if (!user) {
            return null;
        }

        var response:any = {
            api_version: "v1",
            id: user.id,
            last_name: user.last_name,
            first_name: user.first_name
        };

        if (options && options.include_status) {
          response.status = user.status;
        }

        return response;
    }
}

export = UserResponse;
