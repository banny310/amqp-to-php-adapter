/**
 * Created by sbanas on 17.04.2017.
 */
"use strict";

const _ = require('lodash');

function Util()
{}

Util.HYDRATORS = [
    [ Buffer, Buffer.prototype.toString ],
    [ Date, Date.prototype.toString ],
    [ String, String.prototype.toString ]
];

/**
 * Converts object to simple literal
 *
 * @param obj
 * @returns {Array}
 */
Util.hydrate = function(obj) {
    const mapFn = (value) => {
        _.forEach(Util.HYDRATORS, (el) => {
            if (value instanceof el[0]) {
                value = el[1].apply(value, []);
            }
        });
        return value;
    };

    const filterFn = (value) => {
        return !_.isFunction(value);// && !_.isObject(value);
    };

    return _.pickBy(_.mapValues(obj, mapFn), filterFn);
};

module.exports = Util;