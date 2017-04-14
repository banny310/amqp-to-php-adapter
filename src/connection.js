/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const amqp = require('amqp');
const util = require('util');
const Promise = require('promise');

function Connection(config, logger) {
    this.config = config;
    this.logger = logger;
    this.connections = {};
}

_.extend(Connection.prototype, {

    /**
     *
     * @param name
     * @returns {*}
     */
    getConnection: function (name) {
        if (!_.has(this.config, name)) {
            throw Error('Connection ' + name + ' not found');
        }

        if (!_.has(this.connections, name)) {
            this.connections[name] = this.initConnection(name);
        }

        return this.connections[name];
    },

    /**
     *
     * @param name
     * @returns {*}
     */
    initConnection: function (name) {
        return new Promise((resolve, reject) => {
            this.logger.info("Connecting RabbitMQ...");

            const config = _.get(this.config, name);
            const connection = new amqp.Connection(config);

            // hook events
            connection.on('error', (e) => {
                this.logger.error("Error from amqp: %s", e.message, e);
                reject(e);
            });

            connection.on('ready', () => {
                this.logger.info("Connected.");
                resolve(connection);
            });

            connection.connect();
        });
    }


});

module.exports = Connection;