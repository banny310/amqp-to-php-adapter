/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const _ = require('lodash');
const yamlConfig = require('yaml-config');
const App = require('./src/app');
const LogProvider = require('./src/log-provider');

// Load configuration
const argv = require('minimist')(process.argv.slice(2));
const configFile = _.defaultTo(argv.config, './config.yml');
const env = _.defaultTo(argv.env, process.env.NODE_ENV);

// Initialize
const config = yamlConfig.readConfig(configFile, env);
const logProvider = new LogProvider(config.logger);
const logger = logProvider.get();

logger.info('Starting for environment \'%s\'', env);
logger.info('Loading config from \'%s\'', configFile);
const app = new App(config, logProvider);
app.run();
logger.info('Started.');

process.on("uncaughtException", function (err) {
    logger.error((new Date).toUTCString() + " Uncaught exception...");
    logger.error(err.message);
    logger.error(err.stack);
    process.exit(1);
});

process.once("SIGTERM", function () {
    logger.info("Kill signal received...");
    app.stop();
});