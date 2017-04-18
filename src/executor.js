/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const fs = require('fs');
const Commander = require('./../src/commander');
const Requester = require('./../src/requester');
const RESULT = require('./../src/result');

function Executor(message, execute, endpoint, logger) {
    this.message = message;
    this.execute = execute;
    this.endpoint = endpoint;
    this.logger = logger;
}

_.extend(Executor.prototype, {

    /**
     * Process message on executor
     */
    process: function (callback) {
        //noinspection JSUnresolvedVariable
        if (this.execute && this.execute.command) {
            this.processCommand(callback);
        }

        if (this.endpoint) {
            this.processRequest(callback);
        }
    },

    /**
     * Pass message as argument on system command
     */
    processCommand: function (callback) {
        const cmder = new Commander(this.execute, this.logger);

        cmder.execute(this.message)
            .then((response) => {
                this.logger.info("Output: %s", response.body);

                callback(response.statusCode);
            }, (exception) => {
                this.logger.error('Cmder error: ' + exception.message);
            });
    },


    /**
     * Pass message as POST to configured endpoint
     */
    processRequest: function (callback) {
        const request = new Requester(this.endpoint, this.logger);

        request.execute(this.message)
            .then((response) => {
                this.logger.info("Output: %s", response.body);

                if (response.statusCode >= 500) {
                    callback(RESULT.REJECT_AND_REQUEUE);
                } else if (response.statusCode >= 400) {
                    callback(RESULT.REJECT);
                } else if (response.statusCode >= 200) {
                    callback(RESULT.ACKNOWLEDGEMENT);
                }
            }, (exception) => {
                this.logger.error('Http error: ' + exception.message);
            });
    }
});

module.exports = Executor;