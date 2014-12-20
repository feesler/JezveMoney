<?php

abstract class Controller
{
	public $action = NULL;
	public $actionParam = NULL;


	abstract public function index();
}
