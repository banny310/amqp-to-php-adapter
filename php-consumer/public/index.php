<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 17.04.2017
 * Time: 22:24
 */

$result = [
    'body' => $_POST['body'],
    'properties' => json_decode($_POST['properties'])
];
$path = realpath(__DIR__ . '/../features/tmp');
$filename = 'result.out';
$q = file_put_contents($path . '/' . $filename, json_encode($result));
echo "Received: " . json_encode($result) . "\n";
echo "File: " . $path . '/' . $filename . "\n";
echo "Written: " . $q . "\n";