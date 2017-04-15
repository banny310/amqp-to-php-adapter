# AMQP to PHP adapter #

## About ##

AMQP to PHP adapter allow consume messages on broker and push the to PHP by cli command or HTTP request

If you are a fellow PHP developer just like me you're probably aware of the following fact: PHP really SUCKS in long running tasks.

When using RabbitMQ with pure PHP consumers you have to deal with stability issues. Probably you are killing your consumers regularly just like me. And try to solve the problem with supervisord. Which also means on every deploy you have to restart your consumers. A little bit dramatic if you ask me.

This library aims at PHP developers solving the above described problem with RabbitMQ. Why don't let the polling over to a NodeJS which is much better suited to run long running tasks.

## Dependencies ##

- NodeJS
- NPM

## Installation ##

Clone repository

```bash
git clone https://github.com/banny310/amqp-to-php-adapter
cd ./amqp-to-php-adapter
```

Install npm dependencies

```bash
npm install
```

Configure config.yml

Run as daemon

```bash
node daemon.js start
```
or run in console

```bash
node server.js
```

## Configuration ##
