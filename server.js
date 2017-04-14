/**
 * Created by sbanas on 14.04.2017.
 */
'use strict';

const yamlConfig = require('yaml-config');
const App = require('./src/app');
const LogProvider = require('./src/log-provider');

const config = yamlConfig.readConfig('./config.yml');
const logProvider = new LogProvider(config.logger);
const logger = logProvider.get();

logger.info('Starting...');
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