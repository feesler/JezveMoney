<?php

class UserApiController extends ApiController
{
	protected $createRequiredFields = [ "login", "password", "name" ];


	public function initAPI()
	{
		parent::initAPI();
	}


	public function login()
	{
		wlog("UserApiController::login()");

		$requiredFields = [ "login", "password" ];
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$reqData = checkFields($_POST, $requiredFields);
		if ($reqData === FALSE)
			$respObj->fail();

		if (!$this->uMod->login($reqData["login"], $reqData["password"]))
			$respObj->fail();

		$respObj->ok();
	}


	public function logout()
	{
		wlog("UserApiController::logout()");

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$this->uMod->logout();

		$respObj->ok();
	}


	public function register()
	{
		wlog("UserApiController::register()");

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if ($this->user_id != 0)		// need to log out first
			$respObj->fail();

		$reqData = checkFields($_POST, $this->createRequiredFields);
		if ($reqData === FALSE)
			$respObj->fail();

		if (!$this->uMod->create($reqData))
			$respObj->fail();

		$respObj->ok();
	}


	protected function getList()
	{
		$res = new apiResponse;

		$res->data = $this->uMod->getData();
		$res->ok();
	}


	protected function create()
	{
		$defMsg = ERR_USER_CREATE;

		$res = new apiResponse;

		if (!$this->isPOST())
			$res->fail();

		$reqData = checkFields($_POST, $this->createRequiredFields);
		if ($reqData === FALSE)
			$res->fail($defMsg);

		$reqData["access"] = isset($_POST["access"]) ? intval($_POST["access"]) : 0;

		$new_user_id = $this->uMod->create($reqData);
		if (!$new_user_id)
			$res->fail($defMsg);

		$res->msg = Message::get(MSG_USER_CREATE);

		$res->data = [ "id" => $new_user_id ];
		$res->ok();
	}


	protected function update()
	{
		$defMsg = ERR_USER_UPDATE;

		$res = new apiResponse;

		if (!$this->isPOST())
			$res->fail(defMsg);

		if (!isset($_POST["id"]))
			$res->fail($defMsg);

		$reqData = checkFields($_POST, $this->createRequiredFields);
		if ($reqData === FALSE)
			$res->fail($defMsg);

		if (isset($_POST["access"]))
			$reqData["access"] = intval($_POST["access"]);

		$updateRes = $this->uMod->update($_POST["id"], $reqData);
		if (!$updateRes)
			$res->fail($defMsg);

		$res->msg = Message::get(MSG_USER_UPDATE);
		$res->ok();
	}


	protected function changePassword()
	{
		$requiredFields = [ "id", "password" ];
		$defMsg = ERR_PROFILE_PASSWORD;

		$res = new apiResponse;

		if (!$this->isPOST())
			$res->fail($defMsg);

		$reqData = checkFields($_POST, $requiredFields);
		if ($reqData === FALSE)
			$res->fail($defMsg);

		$uObj = $this->uMod->getItem($reqData["id"]);
		if (!$uObj)
			$res->fail($defMsg);

		if (!$this->uMod->setPassword($uObj->login, $reqData["password"]))
			$res->fail($defMsg);

		$res->msg = Message::get(MSG_PROFILE_PASSWORD);
		$res->ok();
	}
	

	protected function del()
	{
		$defMsg = ERR_USER_DELETE;

		$res = new apiResponse;

		if (!$this->isPOST())
			$res->fail($defMsg);

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$res->fail("No account specified");

		if (!$this->uMod->del($ids))
			$res->fail($defMsg);

		$res->msg = Message::get(MSG_USER_DELETE);
		$res->ok();
	}
}
