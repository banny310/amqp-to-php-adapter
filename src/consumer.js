/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const Executor = require('./../src/executor');
const RESULT = require('./../src/result');

function Consumer(name, config, connectionService, logger) {
    this.name = name;
    this.config = config;
    this.logger = logger;
    this.open = connectionService.getChannel(config.connection);
    this.channel = null;
    this.consumerTag = null;
}

_.extend(Consumer.prototype, {

    /**
     * Start consuming messages
     *
     * @param callback
     */
    consume: function (callback) {
        this.queueDeclare((channel, queue) => {
            this.logger.info("Registering consumer on queue '%s'...", queue);
            const fnConsume = (message) => {
                this.logger.info('Processing message...');

                if (message !== null) {
                    // send to external callback
                    callback(message);

                    // pass to PHP consumer (process internally)
                    const executor = new Executor(
                        message,
                        this.config.execute,
                        this.config.endpoint,
                        this.logger
                    );

                    executor.process((result) => {
                        try {
                            if (message.properties.replyTo) {
                                channel.sendToQueue(message.properties.replyTo, new Buffer('something to do'));
                            }
                            this.handleResult(channel, message, result);
                        } catch (e) {
                            this.logger.error(e.message);
                            this.handleResult(channel, message, RESULT.REJECT_AND_REQUEUE);
                        }
                    });
                    this.logger.info('Succeeded processing message.');
                } else {
                    this.logger.info('Message is empty - ignored.');
                }
            };

            channel.prefetch(1);
            channel.consume(queue, fnConsume, {noAck : false})
                .then((ok) => {
                    //console.log(ok);
                    this.consumerTag = ok.consumerTag;
                    this.logger.info('Succeeded registering consumer with tag: %s', this.consumerTag);
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
        this.open
            .then((channel) => {
                //noinspection JSPotentiallyInvalidUsageOfThis,JSUnresolvedVariable
                const queue = this.config.queue_options.name;
                this.logger.info("Opening queue \"%s\"...", queue);

                //noinspection JSUnresolvedVariable
                return channel.assertQueue(queue, this.config.queue_options)
                    .then((ok) => {
                        //console.log(ok);
                        this.logger.info("Queue \"%s\" opened.", queue);
                        callback.apply(this, [channel, queue]);
                    });
            }, (e) => {
                this.logger.error('Error: %s', e.message, e);
            });
    },

    stop: function () {
        if (this.open && this.consumerTag) {
            this.open.then((channel) => {
                    channel.cancel(this.consumerTag);
                });
        }
    },

    handleResult: function (channel, message, code) {
        switch (code) {
            case RESULT.ACKNOWLEDGEMENT:
                channel.ack(message);
                this.logger.info("Message acknowledged");
                break;

            case RESULT.REJECT:
                channel.reject(message, false);
                this.logger.info("Message rejected");
                break;

            case RESULT.REJECT_AND_REQUEUE:
                channel.reject(message, true);
                this.logger.info("Message rejected and redelivered");
                break;

            default:
                throw new Error('Unrecognised result code: ' + code);
        }
    }

});

module.exports = Consumer;