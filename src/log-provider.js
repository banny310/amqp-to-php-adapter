/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const winston = require('winston');

function LogProvider(config) {
    this.config = config;
    this.container = new winston.Container({transports: this.createTransports()});
}

//noinspection JSUnusedGlobalSymbols
_.extend(LogProvider.prototype, {

    defaultLoggerTransportOptions: {
        timestamp: function() {
            return new Date().toISOString();
        },
        formatter: function(options) {
            return options.timestamp() + ' '
                + options.level.toUpperCase() + ' '
                + (options.message ? options.message : '')
                + (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
        }
    },

    defaultConsoleOptions: {
        colorize: true
    },

    defaultInfoFileOptions: {
        name: 'info-file',
        level: 'info'
    },

    defaultErrorFileOptions: {
        name: 'error-file',
        level: 'error'
    },

    createTransports: function (label, info_log, error_log) {
        //noinspection JSUnresolvedVariable
        info_log = _.defaultTo(info_log, this.config.info_log);
        //noinspection JSUnresolvedVariable
        error_log = _.defaultTo(error_log, this.config.error_log);

        return [
            new (winston.transports.Console)(
                _.extend({}, this.defaultConsoleOptions, {
                    label: label
                })
            ),
            new (winston.transports.File)(
                _.extend({}, this.defaultLoggerTransportOptions, this.defaultInfoFileOptions, {
                    filename: info_log,
                    label: label
                })
            ),

            new (winston.transports.File)(
                _.extend({}, this.defaultLoggerTransportOptions, this.defaultErrorFileOptions, {
                    filename: error_log,
                    label: label
                })
            )
        ];
    },

    get: function (name, config) {
        config = config || {};
        //noinspection JSUnresolvedVariable
        const transports = this.createTransports(name, config.info_log, config.error_log);
        return this.container.get(name, {transports: transports});
    }
});

module.exports = LogProvider;