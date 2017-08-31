<?php

abstract class Controller
{
	public $action = NULL;
	public $actionParam = NULL;
	protected $cssArr = NULL;
	protected $css = NULL;
	protected $jsArr = NULL;


	abstract public function index();


	public function initDefResources()
	{
		$this->css = new stdClass;
		$this->css->clear = array("common.css");
		$this->css->libs = array();
		$this->css->app = array("app.css");
		$this->css->page = array();

		$this->jsArr = array("es5-shim.min.js", "common.js", "ajax.js", "app.js");
	}


	protected function buildCSS()
	{
		if (is_null($this->css))
			return;

		$this->cssArr = array_merge($this->css->clear, $this->css->libs, $this->css->app, $this->css->page);
	}
}
