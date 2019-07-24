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
		$this->css->clear = ["common.css"];
		$this->css->libs = ["popup.css"];
		$this->css->app = ["app.css"];
		$this->css->page = [];
		$this->cssAdmin = ["admin.css"];

		$this->jsArr = ["es5-shim.min.js", "common.js", "ajax.js", "popup.js", "app.js"];
		$this->jsAdmin = [];
	}


	protected function buildCSS()
	{
		if (is_null($this->css))
			return;

		$this->cssArr = array_merge((array)$this->css->clear,
									(array)$this->css->libs,
									(array)$this->css->app,
									(array)$this->css->page);
	}


	// Check current request is POST
	protected function isPOST()
	{
		return ($_SERVER["REQUEST_METHOD"] == "POST");
	}


	// Check request is AJAX
	protected function isAJAX()
	{
		$hdrs = getallheaders();
		return (isset($hdrs["X-Requested-With"]) && $hdrs["X-Requested-With"] == "XMLHttpRequest");
	}


	// Obtain requested ids from actionParam of from GET id parameter and return array of integers
	protected function getRequestedIds($isPOST = FALSE)
	{
		$httpSrc = $isPOST ? $_POST : $_GET;
		if (is_null($this->actionParam) && !isset($httpSrc["id"]))
			return NULL;

		$res = [];

		if (isset($httpSrc["id"]))
		{
			if (is_array($httpSrc["id"]))
			{
				foreach($httpSrc["id"] as $val)
				{
					$val = intval($val);
					if ($val)
						$res[] = $val;
				}
			}
			else
			{
				$val = intval($httpSrc["id"]);
				if ($val)
					$res[] = $val;
			}
		}
		else
		{
			$res[] = intval($this->actionParam);
		}

		return $res;
	}
}
