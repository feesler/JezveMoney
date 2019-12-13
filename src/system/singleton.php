<?php

trait Singleton
{
	protected static $instance = NULL;


	private function __construct(){}
	private function __clone(){}
	private function __wakeup(){}

	public static function getInstance()
	{
		if (self::$instance === NULL)
		{
			self::$instance = new self();
			self::$instance->onStart();
		}

		return self::$instance;
	}


	protected function onStart(){}
}
