<?php

class ProfileApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->personMod = PersonModel::getInstance();
		if (!$this->uMod->currentUser)
			throw new Error("User not found");
		$this->owner_id = $this->uMod->currentUser->owner_id;
	}


	public function read()
	{
		$respObj = new apiResponse;

		$pObj = $this->personMod->getItem($this->owner_id);
		if (!$pObj)
			$respObj->fail("Person not found");

		$respObj->data = [ "user_id" => $this->user_id, "name" => $pObj->name ];
		$respObj->ok();
	}


	public function changename()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$pObj = $this->personMod->getItem($this->owner_id);
		if (!$pObj)
			$respObj->fail("Person not found");

		$old_name = $pObj->name;
		$new_name = $_POST["name"];

		if ($old_name == $new_name)
			$respObj->fail(getMessage(ERR_PROFILE_NAME));

		if (!$this->personMod->update($this->owner_id, [ "name" => $new_name ]))
			$respObj->fail(getMessage(ERR_PROFILE_NAME));

		$respObj->msg = getMessage(MSG_PROFILE_NAME);
		$respObj->data = ["name" => $new_name];

		$respObj->ok();
	}


	public function changepass()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		if (!$this->uMod->changePassword($uObj->login, $_POST["oldpwd"], $_POST["newpwd"]))
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		$respObj->msg = getMessage(MSG_PROFILE_PASSWORD);

		$respObj->ok();
	}


	public function reset()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$accMod = AccountModel::getInstance();
		if (!$accMod->reset($this->user_id))
			$this->fail(getMessage(ERR_PROFILE_RESETALL));

		if (!$this->personMod->reset())
			$this->fail(getMessage(ERR_PROFILE_RESETALL));

		$respObj->msg = getMessage(MSG_PROFILE_RESETALL);

		$respObj->ok();
	}
}
