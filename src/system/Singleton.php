<?php

namespace JezveMoney\Core;

trait Singleton
{
    protected static $instance = null;


    private function __construct()
    {
    }
    private function __clone()
    {
    }
    private function __wakeup()
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
