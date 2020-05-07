<?php

abstract class Controller
{
	public $action = NULL;
	public $actionParam = NULL;


	abstract public function index();

	protected function onStart()
	{
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
