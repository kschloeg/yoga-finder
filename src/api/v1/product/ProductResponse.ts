import _ = require('lodash');

import {ProductInterface} from "productts";

class ProductResponse {
    public static formatProductResponse(product:ProductInterface, externalResponse:any, options?:{hide_price:boolean}) {
        if (!product) {
            return null;
        }

        var general_description = ProductResponse.getDescriptionFromExternalResponse(externalResponse);
        var response:any = {
            api_version: "v1",
            id: product.gid, // Note: id is set to gid
            name: general_description || product.name,
            current_price: options && options.hide_price ? null : product.current_price
        };

        return response;
    }

    public static getDescriptionFromExternalResponse(externalResponse:any):string {
      var items = <{}[]>_.get(externalResponse, 'product_composite_response.items');

      if (!items || !items.length) {
        console.warn("Bad response from external resource");
        return null;
      }

      // Assuming a single item in the items array
      var general_description = <string>_.get(items[0], 'general_description');
      return general_description;
    }
}

export = ProductResponse;
