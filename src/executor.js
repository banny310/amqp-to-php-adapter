/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require("path");
const zlib = require('zlib');
const crypto = require('crypto');
const uuidV4 = require('uuid/v4');
const runner = require("child_process");
const Request = require('./../src/request');
const RESULT = require('./../src/result');
const hydrate = require('./../src/util').hydrate;

const defaultExecuteOptions = {
    command : null,
    compression : false,
    properties : false
};

const defaultExecProperties = {
    encoding: 'UTF-8',
    timeout: 300000
};

function Executor(message, execute, endpoint, logger) {
    this.message = message;
    this.execute = _.extend(defaultExecuteOptions, execute);
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
        let tmpfile = null;
        //noinspection JSUnresolvedVariable
        let payload = (this.execute.properties)
            ? JSON.stringify({
                body: this.message.body.data.toString(),
                properties: hydrate(this.message.properties)
            })
            : this.message.body.data.toString();

        //console.log(payload);

        //noinspection JSUnresolvedVariable
        if (this.execute.compression) {
            switch (this.execute.compression) {
                case 'gzcompress':
                    payload = zlib.deflateSync(new Buffer(payload)).toString('base64');
                    break;
                case 'gzdeflate':
                    payload = zlib.deflateRawSync(new Buffer(payload)).toString('base64');
                    break;
                default:
                    throw new Error('Unrecognised compression algorithm "%s"', this.execute.compression);
            }
        } else {
            payload = new Buffer(payload).toString('base64');
        }

        //noinspection JSUnresolvedVariable
        this.logger.info('Executing command: %s', this.execute.command);

        //noinspection JSUnresolvedVariable
        let cmd = this.execute.command;
        if (cmd.indexOf('{file}') !== -1) {
            tmpfile = path.resolve('./tmp/' + uuidV4() + '.msg');
            fs.writeFile(tmpfile, payload, (err) => {
                if (err) {
                    throw new Error(err);
                }
            });
            cmd = cmd.replace('{file}', tmpfile);
        } else if (cmd.indexOf('{content}') !== -1) {
            cmd = cmd.replace('{content}', payload);
        } else {
            cmd = cmd + ' ' + payload;
        }

        const options = _.extend({}, defaultExecProperties, this.execute);

        runner.exec(cmd, options, (error, stdout, stderr) => {
            this.logger.info("Output: %s", stdout);
            if (error) {
                this.logger.error('Failed: %s', stderr);
                this.logger.error('Result: %s', error.code);
                this.logger.error(error);
            } else {
                // command successful executed
                // remove temp file if saved
                if (tmpfile) {
                    fs.unlinkSync(tmpfile);
                }
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