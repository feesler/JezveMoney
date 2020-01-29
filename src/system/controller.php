<?php

abstract class Controller
{
	public $action = NULL;
	public $actionParam = NULL;
	protected $cssArr = NULL;
	protected $css = NULL;
	protected $jsArr = NULL;


	abstract public function index();

	protected function onStart()
	{
	}


	public function initDefResources()
	{
		$this->css = new stdClass;
		$this->css->clear = ["common.css"];
		$this->css->libs = ["popup.css"];
		$this->css->app = ["app.css"];
		$this->css->page = [];

		$this->jsArr = ["lib/polyfill.min.js", "common.js", "ajax.js", "popup.js", "app.js"];
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


	// Check user status required for page access
	public function checkUser($loggedIn = TRUE, $adminOnly = FALSE)
	{
		$this->uMod = UserModel::getInstance();
		// Check session and cookies
		$this->user_id = $this->uMod->check();

		// Get name of user person
		if ($this->user_id)
		{
			if (!$this->uMod->currentUser)
				throw new Error("User not found");

			$this->personMod = PersonModel::getInstance();
			$personObj = $this->personMod->getItem($this->uMod->currentUser->owner_id);
			if ($personObj)
				$this->user_name = $personObj->name;
		}

		if ($loggedIn)		// user should be logged in to access
		{
			if (!$this->user_id)
				setLocation(BASEURL."login/");
			else if ($adminOnly && !$this->uMod->isAdmin($this->user_id))
				setLocation(BASEURL);
		}
		else				// user should be logged out ot access
		{
			if ($this->user_id != 0)
				setLocation(BASEURL);
		}

		$this->onStart();
	}
}
