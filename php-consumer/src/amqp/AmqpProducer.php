<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 16.04.2017
 * Time: 06:09
 */

namespace App\Amqp;

use PhpAmqpLib\Channel\AMQPChannel;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class AmqpProducer
{
    /**
     * @var AMQPChannel
     */
    private $channel;

    function __construct(AMQPStreamConnection $connection)
    {
        $this->channel = new AMQPChannel($connection);
    }

    public function publish(AMQPMessage $message, $queue)
    {
        $this->channel->queue_declare($queue, false, true, false, false);
        $this->channel->basic_publish($message, '', $queue);
    }
}