<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 15.04.2017
 * Time: 21:11
 */

namespace App;

use App\Amqp\AmqpProducerService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class AmqpProducerCommand extends Command
{
    protected function configure()
    {
        $this
            ->setName('app:producer')
            ->addArgument('message', InputArgument::REQUIRED)
            ->addOption('queue', 'q', InputOption::VALUE_REQUIRED)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $body = $input->getArgument('message');
        $queue = $input->getOption('queue');

        AmqpProducerService::getInstance()->publish($body, $queue);

//        $connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
//        $channel = new AMQPChannel($connection);
//        $channel->queue_declare($queue, false, true, false, false);
//        $message = new AMQPMessage($body, ['delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT]);
//        $channel->basic_publish($message, '', $queue);
    }
}