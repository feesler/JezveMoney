<?php

abstract class Controller
{
	public $action = NULL;
	public $actionParam = NULL;
	protected $headers = NULL;


	abstract public function index();

	protected function onStart()
	{
	}


	// Check current request is POST
	protected function isPOST()
	{
		return ($_SERVER["REQUEST_METHOD"] == "POST");
	}


	protected function getHeader($name)
	{
		if (is_empty($name))
			return NULL;

		if (is_null($this->headers))
		{
			$this->headers = [];
			foreach(getallheaders() as $header => $value)
			{
				$this->headers[strtolower($header)] = $value;
			}
		}

		$lname = strtolower($name);
		if (isset($this->headers[$lname]))
			return $this->headers[$lname];

		return NULL;
	}


	// Check request is AJAX
	protected function isAJAX()
	{
		$xRequestedWith = $this->getHeader("X-Requested-With");

		return ($xRequestedWith && $xRequestedWith == "XMLHttpRequest");
	}


	// Obtain input of request and try to decode it as JSON
	protected function getJSONContent($asArray = FALSE)
	{
		$rawData = file_get_contents('php://input');

		try
		{
			$json = JSON::decode($rawData, $asArray);
		}
		catch(Exception $e)
		{
			wlog($e);
			$json = NULL;
		}

		return $json;
	}


	// Obtain requested ids from actionParam of from GET id parameter and return array of integers
	protected function getRequestedIds($isPOST = FALSE, $isJSON = FALSE)
	{
		if ($isPOST)
			$httpSrc = ($isJSON) ? $this->getJSONContent(TRUE) : $_POST;
		else
			$httpSrc = $_GET;

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
