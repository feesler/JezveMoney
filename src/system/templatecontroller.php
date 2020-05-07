<?php

abstract class TemplateController extends Controller
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


	// Check user status required for page access
	public function checkUser($loggedIn = TRUE, $adminOnly = FALSE)
	{
		$this->uMod = UserModel::getInstance();
		// Check session and cookies
		$this->user_id = $this->uMod->check();

		// Get name of user person
		if ($this->user_id)
		{
			$this->owner_id = $this->uMod->getOwner();

			$this->personMod = PersonModel::getInstance();
			$personObj = $this->personMod->getItem($this->owner_id);
			if ($personObj)
				$this->user_name = $personObj->name;
		}
		else
		{
			$this->owner_id = 0;
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
