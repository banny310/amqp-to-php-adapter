#!/usr/bin/env php
<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 15.04.2017
 * Time: 21:10
 */

require __DIR__.'/vendor/autoload.php';

use Symfony\Component\Console\Application;

$application = new Application();
$application->add(new App\AmqpConsumerCommand());
$application->add(new App\AmqpProducerCommand());
$application->run();