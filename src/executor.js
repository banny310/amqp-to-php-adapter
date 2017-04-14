/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const exec = require('child_process').exec;
const Request = require('./../src/request');
const zlib = require('zlib');
const RESULT = require('./../src/result');

const defaultExecProperties = {
    encoding: 'UTF-8',
    timeout: 300
};

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
        //noinspection JSUnresolvedVariable
        let payload = (this.execute.properties)
            ? JSON.stringify({
                body: this.message.body,
                properties: this.message.headers
            })
            : this.message.body;

        //noinspection JSUnresolvedVariable
        if (this.execute.compression) {
            payload = zlib.gzipSync(new Buffer(payload));
        }
        //noinspection JSUnresolvedVariable
        const cmd = this.execute.command + ' ' + new Buffer(payload).toString('base64');
        const options = _.extend({}, defaultExecProperties, this.execute);

        //noinspection JSUnresolvedVariable
        this.logger.info('Executing command: %s', this.execute.command + ' {message}');

        exec(cmd, options, (error, stdout, stderr) => {
            this.logger.info('Output: %s', stdout);
            if (error) {
                this.logger.error('Failed: %s', stderr);
                this.logger.error('Result: %s', error.code);
            }

            callback(error ? error.code : RESULT.ACKNOWLEDGEMENT);
        });
    },


    /**
     * Pass message as POST to configured endpoint
     */
    processRequest: function (callback) {
        //noinspection JSUnresolvedVariable
        let request = new Request(this.endpoint, this.logger);

        request.execute(this.message)
            .then((response) => {
                //noinspection JSPotentiallyInvalidUsageOfThis
                this.logger.info("Output: %s", response.body);

                if (response.statusCode >= 500) {
                    callback(RESULT.REJECT_AND_REQUEUE);
                } else if (response.statusCode >= 400) {
                    callback(RESULT.REJECT);
                } else if (response.statusCode >= 200) {
                    callback(RESULT.ACKNOWLEDGEMENT);
                }
            }, function (exception) {
                //noinspection JSPotentiallyInvalidUsageOfThis
                this.logger.error('Http error: ' + exception.message);
            });
    }
});

module.exports = Executor;