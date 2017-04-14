/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const Connection = require('./../src/connection');
const Consumer = require('./../src/consumer');
const inspect = require('util').inspect;

function App(config, logProvider) {
    this.config = config;
    this.logProvider = logProvider;
    this.logger = logProvider.get();
    this.connection = new Connection(config.connections, this.logger);
    this.consumers = {};
}

_.extend(App.prototype, {

    run : function() {
        //noinspection JSUnresolvedVariable
        _.forEach(this.config.consumers, (config, name) => {
            this.runConsumer(config, name);
        });
    },

    runConsumer : function(config, name) {
        //noinspection JSUnresolvedVariable
        const logger = this.logProvider.get(name, config);
        const consumer = new Consumer(name, config, this.connection, logger);
        consumer.consume((message) => {
            //this.logger.info('Message arrived', message);
            //inspect(message);
        });
        this.consumers[name] = consumer;
    },

    stop : function() {
        this.logger.info('Stopping consumers...');
        _.forEach(this.consumers, (consumer) => {
            consumer.stop();
        })
    }
});

module.exports = App;