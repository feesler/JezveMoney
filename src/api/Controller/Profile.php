<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;


class ProfileApiController extends ApiController
{
	protected $personMod = NULL;


	public function initAPI()
	{
		parent::initAPI();

		$this->personMod = PersonModel::getInstance();
		if (!$this->user_id)
			throw new \Error("User not found");
	}


	public function read()
	{
		$pObj = $this->personMod->getItem($this->owner_id);
		if (!$pObj)
			$this->fail("Person not found");

		$this->ok([ "user_id" => $this->user_id, "owner_id" => $this->owner_id, "name" => $pObj->name ]);
	}


	public function changename()
	{
		$requiredFields = [ "name" ];
		$defMsg = Message::get(ERR_PROFILE_NAME);

		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		if (!$this->personMod->update($this->owner_id, $reqData))
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_PROFILE_NAME));
		$this->ok($reqData);
	}


	public function changepass()
	{
		$requiredFields = [ "current", "new" ];
		$defMsg = Message::get(ERR_PROFILE_PASSWORD);

		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $requiredFields);
		if ($reqData === FALSE)
			$this->fail($defMsg);

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$this->fail($defMsg);

		if (!$this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"]))
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_PROFILE_PASSWORD));
		$this->ok();
	}


	public function reset()
	{
		$defMsg = Message::get(ERR_PROFILE_PASSWORD);

		if (!$this->isPOST())
			$this->fail();

		$accMod = AccountModel::getInstance();
		if (!$accMod->reset($this->user_id))
			$this->fail($defMsg);

		if (!$this->personMod->reset())
			$this->fail($defMsg);

		$this->setMessage(Message::get(MSG_PROFILE_RESETALL));
		$this->ok();
	}


	public function del()
	{
		if (!$this->isPOST())
			$this->fail();

		if (!$this->uMod->del($this->user_id))
			$this->fail();

		$this->ok();
	}
}
