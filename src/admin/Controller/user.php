<?php

class UserAdminController extends AdminController
{
	public function index()
	{
		$uArr = $this->uMod->getData([ "all" => TRUE ]);

		$this->menuItems["users"]["active"] = TRUE;

		$titleString = "Admin panel | Users";

		$this->cssAdmin[] = "currency.css";
		$this->buildCSS();
		$this->jsArr[] = "currency.js";
		$this->jsAdmin[] = "user.js";

		include("./view/templates/user.tpl");
	}


	public function fail($msg = NULL)
	{
		if (!is_null($msg))
			Message::set($msg);

		setLocation(BASEURL."admin/user/");
	}


	public function create()
	{
		$defMsg = ERR_USER_CREATE;

		if (!isset($_POST["user_login"]) || !isset($_POST["user_pass"]) || !isset($_POST["user_name"]))
			$this->fail($defMsg);

		if (!$this->uMod->register($_POST["user_login"], $_POST["user_pass"], $_POST["user_name"]))
			$this->fail($defMsg);

		Message::set(MSG_USER_CREATE);

		setLocation(BASEURL."admin/user/");
	}


	public function update()
	{
		$defMsg = ERR_USER_UPDATE;

		if (!isset($_POST["user_id"]))
			$this->fail($defMsg);

		if (isset($_POST["user_login"]))
		{
			if (!$this->uMod->setLogin($_POST["user_id"], $_POST["user_login"]))
				$this->fail($defMsg);
		}

		if (isset($_POST["user_name"]))
		{
			$userObj = $this->uMod->getItem($_POST["user_id"]);
			if (!$userObj)
				$this->fail($defMsg);

			if (!$this->personMod->update($userObj->owner_id, [ "name" => $_POST["user_name"] ]))
				$this->fail($defMsg);
		}

		$isAdminFlag = isset($_POST["isadmin"]) && $_POST["isadmin"] == "on";
		$this->uMod->setAccess($_POST["user_id"], $isAdminFlag ? 1 : 0);

		Message::set(MSG_USER_UPDATE);

		setLocation(BASEURL."admin/user/");
	}


	public function changePassword()
	{
		$defMsg = ERR_PROFILE_PASSWORD;

		if (!isset($_POST["user_id"]) || !isset($_POST["user_pass"]))
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($_POST["user_id"]);
		if (!$uObj)
			$this->fail($defMsg);

		if (!$this->uMod->setPassword($uObj->login, $_POST["user_pass"]))
			$this->fail($defMsg);

		Message::set(MSG_PROFILE_PASSWORD);

		setLocation(BASEURL."admin/user/");
	}


	public function del()
	{
		$defMsg = ERR_USER_DELETE;

		if (!isset($_POST["user_id"]))
			$this->fail($defMsg);

		if (!$this->uMod->del($_POST["user_id"]))
			$this->fail($defMsg);

		Message::set(MSG_USER_DELETE);

		setLocation(BASEURL."admin/user/");
	}
}
