<?php

class ProfileController extends Controller
{
	public function index()
	{
		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			throw new Error("User not found");

		$user_login = $uObj->login;

		$action = $this->action;

		$person_name = "";

		$pObj = $this->personMod->getItem($uObj->owner_id);
		if (!$pObj)
			throw new Error("Person not found");

		$person_name = $pObj->name;

		$titleString = "Jezve Money | Profile";
		if ($action == "changename")
			$titleString .= " | Change name";
		else if ($action == "changepassword")
			$titleString .= " | Change password";

		$this->css->libs[] = "iconlink.css";
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

		$owner_id = $this->uMod->getOwner($this->user_id);
		$old_name = $this->personMod->getName($owner_id);

		if ($old_name == $db->escape($new_name))
			$this->fail($defMsg);

		if (!$this->personMod->update($owner_id, [ "name" => $new_name ]))
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_NAME);

		setLocation(BASEURL."profile/");
	}


	public function changePass()
	{
		if ($_SERVER["REQUEST_METHOD"] != "POST")
		{
			$this->index();
			return;
		}

		$defMsg = ERR_PROFILE_PASSWORD;

		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$this->fail($defMsg);

		if (!$this->uMod->changePassword($uObj->login, $_POST["oldpwd"], $_POST["newpwd"]))
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_PASSWORD);

		setLocation(BASEURL."profile/");
	}


	public function resetAll()
	{
		if ($_SERVER["REQUEST_METHOD"] != "POST")
			setLocation(BASEURL."profile/");

		$defMsg = ERR_PROFILE_RESETALL;

		$accMod = AccountModel::getInstance();
		if (!$accMod->reset($this->user_id))
			$this->fail($defMsg);

		if (!$this->personMod->reset())
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_RESETALL);

		setLocation(BASEURL."profile/");
	}


	public function del()
	{
		$defMsg = ERR_PROFILE_DELETE;

		if (!$this->uMod->del($this->user_id))
			$this->fail($defMsg);

		$this->uMod->logout();

		setMessage(MSG_PROFILE_DELETE);

		setLocation(BASEURL."login/");
	}
}
