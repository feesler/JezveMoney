<?php

class UserApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();
	}


	public function login()
	{
		wlog("UserApiController::login()");

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["login"]) || !isset($_POST["pwd"]))
			$respObj->fail();

		if (!$this->uMod->login($_POST["login"], $_POST["pwd"]))
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

		if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
			$respObj->fail();

		if (!$this->uMod->create([ "login" => $_POST["login"],
									"password" => $_POST["password"],
									"name" => $_POST["name"] ]))
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

		if (!isset($_POST["login"]) || !isset($_POST["pass"]) || !isset($_POST["name"]))
			$res->fail($defMsg);

		$new_user_id = $this->uMod->create([ "login" => $_POST["login"],
												"password" => $_POST["password"],
												"name" => $_POST["name"] ]);
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

		if (isset($_POST["login"]))
		{
			if (!$this->uMod->setLogin($_POST["id"], $_POST["login"]))
				$res->fail($defMsg);
		}

		if (isset($_POST["name"]))
		{
			$userObj = $this->uMod->getItem($_POST["id"]);
			if (!$userObj)
				$res->fail($defMsg);

			if (!$this->personMod->update($userObj->owner_id, [ "name" => $_POST["name"] ]))
				$res->fail($defMsg);
		}

		if (isset($_POST["name"]))
		{
			$this->uMod->setAccess($_POST["user_id"], intval($_POST["access"]));
		}

		$res->msg = Message::get(MSG_USER_UPDATE);
		$res->ok();
	}


	protected function changePassword()
	{
		$defMsg = ERR_PROFILE_PASSWORD;

		$res = new apiResponse;

		if (!$this->isPOST())
			$res->fail($defMsg);

		if (!isset($_POST["id"]) || !isset($_POST["pass"]))
			$res->fail($defMsg);

		$uObj = $this->uMod->getItem($_POST["id"]);
		if (!$uObj)
			$res->fail($defMsg);

		if (!$this->uMod->setPassword($uObj->login, $_POST["pass"]))
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
