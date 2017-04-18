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

## Run ##

Run as daemon

```bash
node daemon.js start
```
or run in console

```bash
node server.js
```

Command line options
```
--config /var/www/config.yml (default: ./config.yml)
--env name (default: production)
```

Example:
```bash
node daemon.js start --config /var/www/config.yml --env development
```

## Configuration ##

Example configuration

```yaml
default:
    daemon:
        # user: "www"
        # group: "www"
        # silent: true
        cwd: '/var/www'

    logger:
        error_log: 'logs/filelog-error.log'
        info_log: 'logs/filelog-info.log'

    connections:
        default:
            host:     'localhost'
            port:     5672
            user:     'guest'
            password: 'guest'
            vhost:    '/'

    consumers:
        mail_sender:
            connection:       default
            queue_options:    {name: 'mail-queue', durable: true, autoDelete: false}
            execute:
                # Command to be executed
                # Placeholders:
                # - {content} - will be replaced with base64 encoded message body
                # - {file} - will be replaced with file with stored {content}
                command: 'php bin/console.php amqp:mail-sender --compression gzdeflate {content}'
                # command: 'cat {file} | php bin/console.php amqp:mail-sender --compression gzdeflate'

                # Directory within command will be executed
                cwd: '/var/www/php-consumer'

                # Enable compression for passed argument (default: no compression)
                # allowed options are:
                # - gzcompress - decode with gzuncompress in php
                # - gzdeflate - decode with gzinflate in php
                compression: gzdeflate # [ gzcompress, gzdeflate ]

                # Pass also message properties in {content}
                properties: true
                
            # Optional log files dedicated for this consumer
            error_log:        'logs/mail-sender-error.log'
            info_log:         'logs/mail-sender-info.log'

        endpoint:
            connection:       default
            queue_options:    {name: 'endpoint', durable: true, autoDelete: false}

            # Pass message to endpoint
            # Request will contain POST payload with 'body' and 'properties'
            endpoint:         'http://localhost:8011'

# You may provide environment based config
# All environment configs are inherited from default
production:
    connections:
        default:
            host:     'rabbitmq.example.com'
            port:     5672
            user:     'user'
            password: 'pass'
            vhost:    '/'
```

[See config.yml for more details](config.yml)

## Consumer ##

Example PHP consumer as Symfony console command

```php
class AmqpConsumerCommand extends Command
{
    const ACKNOWLEDGEMENT = 0;
    const REJECT = 3;
    const REJECT_AND_REQUEUE = 4;

    /**
     * Configures the current command.
     */
    protected function configure()
    {
        $this
            ->setName('app:consumer')
            ->addArgument('message', InputArgument::OPTIONAL)
            ->addOption('compression', 'c', InputOption::VALUE_REQUIRED)
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        // get content from stdin or argument
        if ($data = $input->getArgument('message')) {
            $data = base64_decode($data, true);
        } else if (0 === ftell(STDIN)) {
            $data = '';
            while (!feof(STDIN)) {
                $data .= fread(STDIN, 1024);
            }
            $data = base64_decode($data, true);
        } else {
            throw new \InvalidArgumentException("Please provide a message as argument or pipe it to STDIN.");
        }

        // uncompress
        $compression = $input->getOption('compression');
        switch($compression) {
            case "gzcompress":
                $data = gzuncompress($data);
                if (false === $data) {
                    throw new \InvalidArgumentException("Decompression failed");
                }
                break;
            case "gzdeflate":
                $data = gzinflate($data);
                if (false === $data) {
                    throw new \InvalidArgumentException("Decompression failed");
                }
                break;
        }

        $data = json_decode($data, true);

        // restore message
        $msg = new AMQPMessage($data['body'], $data['properties]);
        try {
            return ($this->process($msg))
                ? self::ACKNOWLEDGEMENT
                : self::REJECT;
        } catch(\Exception $e) {
            return self::REJECT_AND_REQUEUE;
        }
    }
    
    private function process(AMQPMessage $message)
    {
        // ...
        
        return true;
    }
}
```

## Tests ##

There are several behat tests in ./php-consumer and prepared for them vagrant environment

```bash
vagrant up
vagrant ssh
cd /var/www/php-consumer
vendor/bin/behat
```