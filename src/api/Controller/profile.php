<?php

class ProfileApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->personMod = PersonModel::getInstance();
		if (!$this->user_id)
			throw new Error("User not found");

		$this->owner_id = $this->uMod->getOwner();
	}


	public function read()
	{
		$respObj = new apiResponse;

		$pObj = $this->personMod->getItem($this->owner_id);
		if (!$pObj)
			$respObj->fail("Person not found");

		$respObj->data = [ "user_id" => $this->user_id, "owner_id" => $this->owner_id, "name" => $pObj->name ];
		$respObj->ok();
	}


	public function changename()
	{
		$requiredFields = [ "name" ];
		$defMsg = Message::get(ERR_PROFILE_NAME);
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$reqData = checkFields($_POST, $requiredFields);
		if ($reqData === FALSE)
			$respObj->fail($defMsg);

		if (!$this->personMod->update($this->owner_id, $reqData))
			$respObj->fail($defMsg);

		$respObj->msg = Message::get(MSG_PROFILE_NAME);
		$respObj->data = $reqData;

		$respObj->ok();
	}


	public function changepass()
	{
		$requiredFields = [ "current", "new" ];
		$defMsg = Message::get(ERR_PROFILE_PASSWORD);
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$reqData = checkFields($_POST, $requiredFields);
		if ($reqData === FALSE)
			$respObj->fail($defMsg);

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$respObj->fail($defMsg);

		if (!$this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"]))
			$respObj->fail($defMsg);

		$respObj->msg = Message::get(MSG_PROFILE_PASSWORD);

		$respObj->ok();
	}


	public function reset()
	{
		$defMsg = Message::get(ERR_PROFILE_PASSWORD);
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$accMod = AccountModel::getInstance();
		if (!$accMod->reset($this->user_id))
			$respObj->fail($defMsg);

		if (!$this->personMod->reset())
			$respObj->fail($defMsg);

		$respObj->msg = Message::get(MSG_PROFILE_RESETALL);

		$respObj->ok();
	}


	public function del()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!$this->uMod->del($this->user_id))
			$respObj->fail();

		$respObj->ok();
	}
}
