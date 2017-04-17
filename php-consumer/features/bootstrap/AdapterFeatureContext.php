<?php

use App\Amqp\AmqpProducer;
use Behat\Behat\Context\Context;
use Behat\Behat\Hook\Scope\AfterFeatureScope;
use Behat\Behat\Hook\Scope\BeforeFeatureScope;
use Behat\Behat\Hook\Scope\BeforeScenarioScope;
use Behat\Gherkin\Node\PyStringNode;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Wire\AMQPTable;
use PHPUnit\Framework\Assert as Assert;

/**
 * Defines application features from the specific context.
 */
class AdapterFeatureContext implements Context
{
    /**
     * @var AmqpProducer
     */
    protected $producer;

    /**
     * @var string
     */
    protected $payload;

    /**
     * @var string
     */
    protected $result;

    /**
     * @var array
     */
    protected $body;

    /**
     * @var array
     */
    protected $properties;

    /**
     * Initializes context.
     *
     * Every scenario gets its own context instance.
     * You can also pass arbitrary arguments to the
     * context constructor through behat.yml.
     */
    public function __construct()
    {
        $connection = new AMQPStreamConnection('localhost', 5672, 'guest', 'guest');
        $this->producer = new AmqpProducer($connection);
    }

    /**
     * @BeforeFeature
     */
    public static function setupFeature(BeforeFeatureScope $scope)
    {
        // start adapter
        echo "Starting adapter...\n";
        self::exec('sudo node daemon.js start --config ./php-consumer/features/adapter_config.yml', '/var/www');

        // start node php server
        echo "Starting php server...\n";
        self::exec('sudo node daemon.js start', '/var/www/php-consumer');
    }

    /**
     * @AfterFeature
     */
    public static function teardownFeature(AfterFeatureScope $scope)
    {
        echo "Stopping adapter and server...\n";
        self::exec('sudo node daemon.js stop', '/var/www');
        self::exec('sudo node daemon.js stop', '/var/www/php-consumer');

        echo "Cleanup...\n";
        $res = self::exec('curl http://guest:guest@localhost:15672/api/queues');
        foreach (json_decode($res['stdout']) as $queue) {
            if (strpos($queue->name, 'behat_') === 0) {
                echo "Queue '{$queue->name}' removed\n";
                self::exec('rabbitmqadmin -u guest -p guest delete queue name=' . $queue->name);
            }
        }
    }

    /**
     * @BeforeScenario
     */
    public function before(BeforeScenarioScope $scope)
    {
        $this->payload = null;
        $this->result = null;
        $this->body = null;
        $this->properties = null;
    }

    protected function decodeResult()
    {
        Assert::assertNotEmpty($this->result);
        $json = json_decode($this->result, true);
        Assert::assertNotFalse($json);

        // assign body
        if (isset($json['body'])) {
            // decode inner object
            $this->body = json_decode($json['body'], true);
            Assert::assertNotFalse($this->body);
        } else {
            $this->body = $json;
        }

        // assign props
        if (isset($json['properties'])) {
            $this->properties = $json['properties'];
        }
    }

    /**
     * @Given /^remove result file "([^"]*)"$/
     */
    public function removeResultFile($filename)
    {
        @unlink($filename);
    }

    /**
     * @Given /^ensure adapter is running$/
     */
    public function ensureAdapterIsRunning()
    {
        $status = self::exec('sudo node daemon.js status', '/var/www');
        Assert::assertContains('Daemon running.', $status['stdout']);
    }

    /**
     * @Given /^ensure php sever is running$/
     */
    public function ensurePhpSeverIsRunning()
    {
        $status = self::exec('sudo node daemon.js status', '/var/www/php-consumer');
        Assert::assertContains('Daemon running.', $status['stdout']);
    }

    /**
     * @Given /^I have the payload:$/
     */
    public function iHaveThePayload(PyStringNode $string)
    {
        $json = json_decode($string->getRaw(), true);
        $this->payload = json_encode($json);
    }

    /**
     * @When /^I send on queue "([^"]*)"$/
     */
    public function iSendOnQueue($queue)
    {
        $message = new AMQPMessage($this->payload, [
            'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
            'correlation_id' => 'corr_id',
            'application_headers' => new AMQPTable([
                'custom_property' => 'custom_value'
            ])
        ]);
        $this->producer->publish($message, $queue);
    }

    /**
     * @Given /^I wait for response for (\d+) sec$/
     */
    public function iWaitForResponseForSec($seconds)
    {
        sleep($seconds);
    }

    /**
     * @Then /^the result should be in "([^"]*)"$/
     */
    public function theResultShouldBeIn($filename)
    {
        Assert::assertFileExists($filename);
        Assert::assertFileIsReadable($filename);
        $this->result = file_get_contents($filename);
    }

    /**
     * @Given /^the result should be a json$/
     */
    public function theResultShouldBeAJson()
    {
        $this->decodeResult();
    }

    /**
     * @Given /^the result should have message properties$/
     */
    public function theResultShouldHaveMessageProperties()
    {
        Assert::assertNotNull($this->properties);
    }

    /**
     * @Given /^the "([^"]*)" property should equal "([^"]*)"$/
     */
    public function thePropertyShouldEqual($property, $expected)
    {
        $actual = self::extractValueFromArray($property, $this->body);
        Assert::assertEquals($expected, $actual);
    }

    /**
     * @Given /^the "([^"]*)" property should be null$/
     */
    public function thePropertyShouldBeNull($property)
    {
        $actual = self::extractValueFromArray($property, $this->body);
        Assert::assertNull($actual);
    }

    /**
     * @Given /^the header "([^"]*)" should equal "([^"]*)"$/
     */
    public function theHeaderShouldEqual($property, $expected)
    {
        $actual = self::extractValueFromArray('headers.' . $property, $this->properties);
        Assert::assertEquals($expected, $actual);
    }

    /**
     *
     * @param $cmd
     * @param $cwd
     * @param null $stdin
     * @return array|bool
     */
    protected static function exec($cmd, $cwd = null, $stdin = null)
    {
        $descriptorspec = array(
            0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
            1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
            2 => array("pipe", "w")   // stderr is a pipe that the child will write to
        );

        $process = proc_open($cmd, $descriptorspec, $pipes, $cwd);

        if (is_resource($process)) {
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
            // 1 => readable handle connected to child stdout
            // Any error output will be appended to /tmp/error-output.txt

            fwrite($pipes[0], $stdin);
            fclose($pipes[0]);

            $stdout = stream_get_contents($pipes[1]);
            fclose($pipes[1]);

            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[2]);

            // It is important that you close any pipes before calling
            // proc_close in order to avoid a deadlock
            $code = proc_close($process);

            return [
                'stdout' => $stdout,
                'stderr' => $stderr,
                'result' => $code
            ];
        }

        throw new \RuntimeException("Could not run command {$cmd}");
    }

    /**
     * return a value taken from an array according to the selector
     * selector can contains "." (dot) to go down inside the array
     *
     * @param string $selector
     * @param array $source
     * @return array|mixed|null
     */
    protected static function extractValueFromArray($selector, array $source)
    {
        if (false !== strpos($selector, '.')) {
            $pt = $source;
            $parts = explode('.', $selector);
            foreach ($parts as $part) {
                if (!isset($pt[$part]))
                    return null;

                $pt = $pt[$part];
            }

            return $pt;
        }

        return isset($source[$selector]) ? $source[$selector] : null;
    }
}
