/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const Executor = require('./../src/executor');
const RESULT = require('./../src/result');

function Consumer(name, config, connection, logger) {
    this.name = name;
    this.config = config;
    this.logger = logger;
    this.connection = connection.getConnection(config.connection);
    this.queue = null;
    this.ctag = null;
}

_.extend(Consumer.prototype, {

    /**
     * Start consuming messages
     *
     * @param callback
     */
    consume: function (callback) {
        this.queueDeclare((queue) => {
            this.logger.info('Registering consumer...');
            queue.subscribe({
                ack: true,
                prefetchCount: 1
            }, (body, headers, deliveryInfo, messageObject) => {
                //noinspection JSUnresolvedVariable
                this.logger.info('Processing message...');

                const message = {
                    body: body,
                    properties: deliveryInfo
                };

                callback(message);

                const executor = new Executor(
                    message,
                    this.config.execute,
                    this.config.endpoint,
                    this.logger
                );
                executor.process((result) => {
                    try {
                        this.handleResult(messageObject, result);
                    } catch(e) {
                        this.logger.error(e.message);
                        this.handleResult(messageObject, RESULT.REJECT_AND_REQUEUE);
                    }
                });

                this.logger.info('Succeeded processing message.');
            }).addCallback((ok) => {
                this.ctag = ok.consumerTag;
                this.logger.info('Succeeded registering consumer with tag: %s', this.ctag);
                this.logger.info('Waiting for messages...');
            });
        });
    },

    /**
     * Declare queue
     *
     * @param callback
     */
    queueDeclare: function (callback) {
        this.connection
            .then((connection) => {
                //noinspection JSPotentiallyInvalidUsageOfThis,JSUnresolvedVariable
                const queueName = this.config.queue_options.name;
                this.logger.info("Opening queue \"%s\"...", queueName);

                //noinspection JSPotentiallyInvalidUsageOfThis,JSUnresolvedVariable
                this.queue = connection.queue(queueName, this.config.queue_options, (queue) => {
                    this.logger.info("Queue \"%s\" opened.", queue.name);
                    //noinspection JSUnresolvedFunction
                    callback.apply(this, [queue]);
                });
            }, (e) => {
                this.logger.error('Error: %s', e.message, e);
            });
    },

    stop: function () {
        if (this.queue && this.ctag) {
            this.queue.unsubscribe(this.ctag);
        }
    },

    handleResult: function (messageObject, code) {
        switch (code) {
            case RESULT.ACKNOWLEDGEMENT:
                //noinspection JSUnresolvedVariable
                messageObject.acknowledge(false);
                this.logger.info("Message acknowledged");
                break;

            case RESULT.REJECT:
                //noinspection JSUnresolvedVariable
                messageObject.reject(false);
                this.logger.info("Message rejected");
                break;

            case RESULT.REJECT_AND_REQUEUE:
                //noinspection JSUnresolvedVariable
                messageObject.reject(true);
                this.logger.info("Message rejected and redelivered");
                break;

            default:
                throw new Error('Unrecognised result code: ' + code);
        }
    }

});

module.exports = Consumer;