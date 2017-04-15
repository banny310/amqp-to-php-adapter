/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const yamlConfig = require('yaml-config');
const App = require('./src/app');
const LogProvider = require('./src/log-provider');

const env = process.env.NODE_ENV || 'production';
const config = yamlConfig.readConfig('./config.yml', env);
const logProvider = new LogProvider(config.logger);
const logger = logProvider.get();

logger.info('Starting...');
logger.info('Loading config...%s', env);
const app = new App(config, logProvider);
app.run();

process.on("uncaughtException", function (err) {
    logger.error("Uncaught exception...");
    logger.error(err.stack);
});

process.once("SIGTERM", function () {
    logger.info("Stopping...");
    app.stop();
});