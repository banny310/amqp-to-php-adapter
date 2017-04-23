/**
 * Created by sbanas on 18.04.2017.
 */
"use strict";

const _ = require('lodash');
const Promise = require('promise');
const fs = require('fs');
const uuidV4 = require('uuid/v4');
const path = require("path");
const zlib = require('zlib');
const runner = require("child_process");
const RESULT = require('./../src/result');
const hydrate = require('./../src/util').hydrate;

const defaultCommandConfig = {
    command: undefined,
    compression: undefined,
    properties: false
};

const defaultExecProperties = {
    encoding: 'UTF-8',
    timeout: 300000
};

const COMPRESSOR = {
    GZCOMPRESS : 'gzcompress',
    GZDEFLATE : 'gzdeflate',
    NONE : 'none'
};

function Commander(config, logger) {
    "use strict";
    this.config = _.extend({}, defaultCommandConfig, config);
    this.logger = logger;
}

_.extend(Commander.prototype, {
    /**
     * Execute command for given message and return response
     *
     * @param message
     * @returns {*|Promise}
     */
    execute: function (message) {
        return new Promise((resolve, reject) => {

            let tmpfile = null;
            let payload = (this.config.properties)
                ? JSON.stringify({
                    body: message.content.toString(),
                    properties: hydrate(message.properties)
                })
                : message.content.toString();

            // apply compression
            payload = (this.config.compression)
                    ? this.compress(payload)
                    : new Buffer(payload).toString('base64');

            this.logger.info('Executing command: %s', this.config.command);

            const fnSaveToTempFile = (content) => {
                // file saver
                tmpfile = path.resolve('./tmp/' + uuidV4() + '.msg');
                fs.writeFile(tmpfile, content, (err) => {
                    if (err) {
                        throw new Error(err);
                    }
                });
            };

            const cmd = this.resolveCommand(payload, fnSaveToTempFile);
            const options = _.extend({}, defaultExecProperties, this.config);

            runner.exec(cmd, options, (error, stdout, stderr) => {
                if (error) {
                    this.logger.error('Result: %s', error.code);
                    this.logger.error(stderr);
                    this.logger.error(error);

                    reject({
                        statusCode: error.code,
                        body: stderr + stdout
                    });
                } else {
                    // command successful executed (result.code == 0)
                    // remove temp file if saved
                    if (tmpfile) {
                        fs.unlinkSync(tmpfile);
                    }

                    resolve({
                        statusCode: RESULT.ACKNOWLEDGEMENT,
                        body: stderr + stdout
                    });
                }
            });

        });
    },

    compress : function(payload) {
        switch (this.config.compression) {
            case COMPRESSOR.GZCOMPRESS:
                return zlib.deflateSync(new Buffer(payload)).toString('base64');

            case COMPRESSOR.GZDEFLATE:
                return zlib.deflateRawSync(new Buffer(payload)).toString('base64');

            case COMPRESSOR.NONE:
                return payload;

            default:
                throw new Error('Unrecognised compression algorithm "%s"', this.config.compression);
        }
    },

    resolveCommand : function(payload, fnSaveToFile) {
        let cmd = this.config.command;
        if (cmd.indexOf('{file}') !== -1) {
            cmd = cmd.replace('{file}', fnSaveToFile(payload));
        } else if (cmd.indexOf('{content}') !== -1) {
            cmd = cmd.replace('{content}', payload);
        } else {
            cmd = cmd + ' ' + payload;
        }

        return cmd;
    }
});

module.exports = Commander;

