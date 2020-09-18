<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;


class ProfileController extends TemplateController
{
	public function index()
	{
		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			throw new \Error("User not found");

		$user_login = $uObj->login;

		$action = $this->action;

		$person_name = "";

		$pObj = $this->personMod->getItem($uObj->owner_id);
		if (!$pObj)
			throw new \Error("Person not found");

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

		include(TPL_PATH."profile.tpl");
	}


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			Message::set($msg);
		setLocation(BASEURL."profile/");
	}


	public function changeName()
	{
		$requiredFields = [ "name" ];

		if (!$this->isPOST())
			setLocation(BASEURL."profile/");

		$defMsg = ERR_PROFILE_NAME;

		$reqData = checkFields($_POST, $requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$owner_id = $this->uMod->getOwner($this->user_id);

		if (!$this->personMod->update($owner_id, $reqData))
			$this->fail($defMsg);

		Message::set(MSG_PROFILE_NAME);

		setLocation(BASEURL."profile/");
	}


	public function changePass()
	{
		$requiredFields = [ "current", "new" ];

		if (!$this->isPOST())
			setLocation(BASEURL."profile/");

		$defMsg = ERR_PROFILE_PASSWORD;

		$reqData = checkFields($_POST, $requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$this->fail($defMsg);

		if (!$this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"]))
			$this->fail($defMsg);

		Message::set(MSG_PROFILE_PASSWORD);

		setLocation(BASEURL."profile/");
	}


	public function reset()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."profile/");

		$defMsg = ERR_ACCOUNTS_RESET;

		$accMod = AccountModel::getInstance();
		if (!$accMod->reset())
			$this->fail($defMsg);

		Message::set(MSG_ACCOUNTS_RESET);

		setLocation(BASEURL."profile/");
	}


	public function resetAll()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."profile/");

		$defMsg = ERR_PROFILE_RESETALL;

		$accMod = AccountModel::getInstance();
		if (!$accMod->reset())
			$this->fail($defMsg);

		if (!$this->personMod->reset())
			$this->fail($defMsg);

		Message::set(MSG_PROFILE_RESETALL);

		setLocation(BASEURL."profile/");
	}


	public function del()
	{
		if (!$this->isPOST())
			setLocation(BASEURL."profile/");

		$defMsg = ERR_PROFILE_DELETE;

		if (!$this->uMod->del($this->user_id))
			$this->fail($defMsg);

		Message::set(MSG_PROFILE_DELETE);

		setLocation(BASEURL."login/");
	}
}
