<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 16.04.2017
 * Time: 06:17
 */

namespace App\Amqp;

use App\Singleton;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

class AmqpProducerService extends Singleton
{
    /**
     * @var AmqpProducer
     */
    private $producer;

    /**
     * Constructor
     * @param AMQPStreamConnection $connection
     */
    protected function __construct(AMQPStreamConnection $connection)
    {
        $this->producer = new AmqpProducer($connection);
    }

    /**
     * @return AmqpProducerService
     */
    public static function getInstance()
    {
        return parent::getInstance();
    }

    /**
     * @return AmqpProducerService
     */
    protected static function newInstance()
    {
        $connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
        return new self($connection);
    }

    /**
     * @param $message string
     * @param $queue string
     */
    public function publish($message, $queue)
    {
        $message = new AMQPMessage($message, ['delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT]);
        $this->producer->publish($message, $queue);
    }
}