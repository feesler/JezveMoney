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


	public function register()
	{
		wlog("UserApiController::register()");

		$respObj = new apiResponse;

		if ($this->user_id != 0)		// need to log out first
			$respObj->fail();

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
			$respObj->fail();

		if (!$this->uMod->create([ "login" => $_POST["login"],
									"password" => $_POST["password"],
									"name" => $_POST["name"] ]))
			$this->fail();

		$respObj->ok();
	}
}
