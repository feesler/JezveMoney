<?php

class UserAdminController extends Controller
{
	public function index()
	{
		global $uMod, $user_name, $user_id;
		global $menuItems;

		$uArr = $uMod->getArray();

		$menuItems["users"]["active"] = TRUE;

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
			setMessage($msg);

		setLocation(BASEURL."admin/user.php");
	}


	public function create()
	{
		global $uMod;

		$defMsg = ERR_USER_CREATE;

		if (!isset($_POST["user_login"]) || !isset($_POST["user_pass"]) || !isset($_POST["user_name"]))
			$this->fail($defMsg);

		if (!$uMod->register($_POST["user_login"], $_POST["user_pass"], $_POST["user_name"]))
			$this->fail($defMsg);

		setMessage(MSG_USER_CREATE);

		setLocation(BASEURL."admin/user.php");
	}


	public function update()
	{
		global $uMod;

		$defMsg = ERR_USER_UPDATE;
wlog("UserAdminController::update()");
		if (!isset($_POST["user_id"]))
			$this->fail($defMsg);
wlog("UserAdminController::update() : 1");
		if (isset($_POST["user_login"]))
		{
wlog("UserAdminController::update() : 1.1");
			if (!$uMod->setLogin($_POST["user_id"], $_POST["user_login"]))
				$this->fail($defMsg);
		}

wlog("UserAdminController::update() : 2");

		if (isset($_POST["user_name"]))
		{
wlog("UserAdminController::update() : 2.1");
			$owner_id = $uMod->getOwner($_POST["user_id"]);
wlog("Owner id: ".$owner_id);
wlog("New user name: ".$_POST["user_name"]);

			$pMod = new PersonModel($_POST["user_id"]);
			if (!$pMod->edit($owner_id, $_POST["user_name"]))
				$this->fail($defMsg);
		}

		$isAdminFlag = isset($_POST["isadmin"]) && $_POST["isadmin"] == "on";
		$uMod->setAccess($_POST["user_id"], $isAdminFlag ? 1 : 0);

		setMessage(MSG_USER_UPDATE);

		setLocation(BASEURL."admin/user.php");
	}


	public function changePassword()
	{
		global $uMod;

		$defMsg = ERR_PROFILE_PASSWORD;

		if (!isset($_POST["user_id"]) || !isset($_POST["user_pass"]))
			$this->fail($defMsg);

		$login = $uMod->getLogin($_POST["user_id"]);
		if (!$uMod->setPassword($login, $_POST["user_pass"]))
			$this->fail($defMsg);

		setMessage(MSG_PROFILE_PASSWORD);

		setLocation(BASEURL."admin/user.php");
	}


	public function del()
	{
		global $uMod;

		$defMsg = ERR_USER_DELETE;

		if (!isset($_POST["user_id"]))
			$this->fail($defMsg);

		if (!$uMod->del($_POST["user_id"]))
			$this->fail($defMsg);

		setMessage(MSG_USER_DELETE);

		setLocation(BASEURL."admin/user.php");
	}
}
