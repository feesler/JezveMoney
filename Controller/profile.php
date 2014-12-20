<?php

class ProfileController extends Controller
{
	public $action = NULL;


	public function index()
	{
		global $u, $user_id, $user_name;

		$user_login = $u->getLogin($user_id);

		$action = $this->action;

		$person_name = "";
		$owner_id = $u->getOwner($user_id);

		$person = new Person($user_id);

		$person_name = $person->getName($owner_id);

		$titleString = "Jezve Money | Profile";
		if ($action == "changename")
			$titleString .= " | Change name";
		else if ($action == "changepassword")
			$titleString .= " | Change password";

		$cssArr = array("common.css", "popup.css", "user.css", "iconlink.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "popup.js", "main.js");

		include("./view/templates/profile.tpl");
	}


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation(BASEURL."profile/");
	}


	public function changeName()
	{
		global $u, $user_id, $db;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
		{
			$this->index();
			return;
		}

		$defMsg = ERR_PROFILE_NAME;

		if (!isset($_POST["newname"]))
			$this->fail($defMsg);

		$new_name = $_POST["newname"];
		if (is_null($new_name) || $new_name == "")
			$this->fail($defMsg);

		$owner_id = $u->getOwner($user_id);
		$person = new Person($user_id);
		$old_name = $person->getName($owner_id);

		if ($old_name == $db->escape($new_name))
			$this->fail($defMsg);

		if (!$person->edit($owner_id, $new_name))
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_NAME);

		setLocation(BASEURL."profile/");
	}


	public function changePass()
	{
		global $u, $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
		{
			$this->index();
			return;
		}

		$defMsg = ERR_PROFILE_PASSWORD;

		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			$this->fail($defMsg);

		$login = $u->getLogin($user_id);
		if (!$u->changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_PASSWORD);

		setLocation(BASEURL."profile/");
	}


	public function resetAll()
	{
		global $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."profile/");

		$defMsg = ERR_PROFILE_RESETALL;

		$acc = new Account($user_id);
		if (!$acc->reset())
			$this->fail($defMsg);

		$pers = new Person($user_id);
		if (!$pers->reset())
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_RESETALL);

		setLocation(BASEURL."profile/");
	}
}
