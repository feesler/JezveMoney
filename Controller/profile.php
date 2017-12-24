<?php

class ProfileController extends Controller
{
	public function index()
	{
		global $uMod, $user_id, $user_name;

		$user_login = $uMod->getLogin($user_id);

		$action = $this->action;

		$person_name = "";
		$owner_id = $uMod->getOwner($user_id);

		$pMod = new PersonModel($user_id);

		$person_name = $pMod->getName($owner_id);

		$titleString = "Jezve Money | Profile";
		if ($action == "changename")
			$titleString .= " | Change name";
		else if ($action == "changepassword")
			$titleString .= " | Change password";

		$this->css->libs = array("iconlink.css");
		$this->css->page[] = "user.css";
		$this->buildCSS();
		array_push($this->jsArr, "main.js");

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
		global $uMod, $user_id, $db;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
		{
			$this->index();
			return;
		}

		$defMsg = ERR_PROFILE_NAME;

		if (!isset($_POST["newname"]))
			$this->fail($defMsg);

		$new_name = $_POST["newname"];
		if (is_empty($new_name))
			$this->fail($defMsg);

		$owner_id = $uMod->getOwner($user_id);
		$pMod = new PersonModel($user_id);
		$old_name = $pMod->getName($owner_id);

		if ($old_name == $db->escape($new_name))
			$this->fail($defMsg);

		if (!$pMod->edit($owner_id, $new_name))
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_NAME);

		setLocation(BASEURL."profile/");
	}


	public function changePass()
	{
		global $uMod, $user_id;

		if ($_SERVER["REQUEST_METHOD"] != "POST")
		{
			$this->index();
			return;
		}

		$defMsg = ERR_PROFILE_PASSWORD;

		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			$this->fail($defMsg);

		$login = $uMod->getLogin($user_id);
		if (!$uMod->changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
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

		$accMod = new AccountModel($user_id);
		if (!$accMod->reset())
			$this->fail($defMsg);

		$pMod = new PersonModel($user_id);
		if (!$pMod->reset())
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_RESETALL);

		setLocation(BASEURL."profile/");
	}
}
