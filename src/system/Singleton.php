<?php

namespace JezveMoney\Core;

trait Singleton
{
    protected static $instance = null;


    public function __construct()
    {
    }
    public function __clone()
    {
    }
    public function __wakeup()
    {
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
            self::$instance->onStart();
        }

        return self::$instance;
    }


    protected function onStart()
    {
    }
}
