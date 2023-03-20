<?php

namespace JezveMoney\Core;

/**
 * Singleton trait
 */
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

    /**
     * Returns instance of class
     *
     * @return object
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            /* @phan-suppress-next-line PhanTypeInstantiateTraitStaticOrSelf */
            self::$instance = new self();
            self::$instance->onStart();
        }

        return self::$instance;
    }

    /**
     * Instance initialization
     */
    protected function onStart()
    {
    }
}
