<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 15.04.2017
 * Time: 21:11
 */

namespace App;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

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
            ->addOption('output', 'o', InputOption::VALUE_OPTIONAL)
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

        //$data = json_decode($data, true);

        $output = $input->getOption('output');
        if ($output) {
            file_put_contents($output, $data);
        }

        return self::ACKNOWLEDGEMENT;
    }
}