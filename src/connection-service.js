/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const util = require('util');
const amqp = require('amqplib');
const querystring = require('querystring');
const Promise = require('promise');

const defaultConnectionProps = {
    protocol: 'amqp',
    host: 'localhost',
    port: 5672,
    user: 'guest',
    password: 'guest',
    vhost: '/',
    options: {}
};

function ConnectionService(config, logger) {
    this.config = config;
    this.logger = logger;
    this.channels = {};
}

_.extend(ConnectionService.prototype, {

    /**
     *
     * @param name
     * @returns {*}
     */
    getChannel: function (name) {
        if (!_.has(this.config, name)) {
            throw Error('Connection ' + name + ' not found');
        }

        if (!_.has(this.channels, name)) {
            this.channels[name] = this.initChannel(name);
        }

        return this.channels[name];
    },

    /**
     *
     * @param name
     * @returns {*}
     */
    initChannel: function (name) {
        return new Promise((resolve, reject) => {
            this.logger.info("Connecting RabbitMQ...");
            const config = _.get(this.config, name);
            const url = config.url ? config.url : this.createConnectionString(config);
            const open = amqp.connect(url);

            //noinspection JSUnusedLocalSymbols
            open.then((connection) => {
                this.logger.info("Connected.");
                return connection.createChannel();
            }, (e) => {
                this.logger.error("Connect failed: %s", e.message, e);
                reject(e);
            }).then((channel) => {
                this.logger.info("Channel created");
                resolve(channel);
            }).catch((e) => {
                this.logger.error("Error: %s", e.message, e);
                reject(e);
            });

            return open;
        });
    },

    /**
     * Ex.: amqp://guest:guest@localhost:5672
     *
     * @param config
     */
    createConnectionString : function(config) {
        let props = _.extend({}, defaultConnectionProps, config);
        return [
            props.protocol,
            '://',
            props.user,
            ':',
            props.password,
            '@',
            props.host,
            ':',
            props.port,
            '/',
            props.vhost.replace('/', '%2F'),
            !_.isEmpty(props.options) ? '?' + querystring.stringify(props.options) : '',
        ].join('');
    }
});

module.exports = ConnectionService;