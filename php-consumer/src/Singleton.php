<?php
/**
 * Created by PhpStorm.
 * User: sbanas
 * Date: 16.04.2017
 * Time: 06:19
 */

namespace App;


abstract class Singleton
{
    /**
     * @var array
     */
    private static $_instances = [];

    /**
     * @return mixed
     */
    public static function getInstance() {
        $class = get_called_class();
        if (!isset(self::$_instances[$class])) {
            self::$_instances[$class] = static::newInstance();
        }
        return self::$_instances[$class];
    }

    /**
     * @return mixed
     */
    abstract protected static function newInstance();
}