<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;


class User extends ApiController
{
	protected $createRequiredFields = [ "login", "password", "name" ];


	public function login()
	{
		$requiredFields = [ "login", "password" ];

		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		if (!$this->uMod->login($reqData["login"], $reqData["password"]))
			$this->fail();

		$this->ok();
	}


	public function logout()
	{
		if (!$this->isPOST())
			$this->fail();

		$this->uMod->logout();

		$this->ok();
	}


	public function register()
	{
		if (!$this->isPOST())
			$this->fail();

		if ($this->user_id != 0)		// need to log out first
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $this->createRequiredFields);
		if ($reqData === FALSE)
			$this->fail();

		if (!$this->uMod->create($reqData))
			$this->fail();

		$this->ok();
	}


	protected function getList()
	{
		$data = $this->uMod->getData();
		$this->ok($data);
	}


	protected function create()
	{
		$defMsg = ERR_USER_CREATE;

		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $this->createRequiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$reqData["access"] = isset($request["access"]) ? intval($request["access"]) : 0;

		$new_user_id = $this->uMod->create($reqData);
		if (!$new_user_id)
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_USER_CREATE));
		$this->ok([ "id" => $new_user_id ]);
	}


	protected function update()
	{
		$defMsg = ERR_USER_UPDATE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$request = $this->getRequestData();
		if (!isset($request["id"]))
			$this->fail($defMsg);

		$reqData = checkFields($request, $this->createRequiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		if (isset($request["access"]))
			$reqData["access"] = intval($request["access"]);

		$updateRes = $this->uMod->update($request["id"], $reqData);
		if (!$updateRes)
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_USER_UPDATE));
		$this->ok();
	}


	protected function changePassword()
	{
		$requiredFields = [ "id", "password" ];
		$defMsg = ERR_PROFILE_PASSWORD;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$request = $this->getRequestData();
		$reqData = checkFields($request, $requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($reqData["id"]);
		if (!$uObj)
			$this->fail($defMsg);

		if (!$this->uMod->setPassword($uObj->login, $reqData["password"]))
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_PROFILE_PASSWORD));
		$this->ok();
	}
	

	protected function del()
	{
		$defMsg = ERR_USER_DELETE;

		if (!$this->isPOST())
			$this->fail($defMsg);

		$ids = $this->getRequestedIds(TRUE, $this->isJsonContent());
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No account specified");

		if (!$this->uMod->del($ids))
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_USER_DELETE));
		$this->ok();
	}
}
