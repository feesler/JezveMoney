<?php

class ProfileApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->pMod = new PersonModel($this->user_id);
		$this->owner_id = $this->uMod->getOwner($this->user_id);
	}


	public function read()
	{
		wlog("ProfileApiController::read()");

		$respObj = new apiResponse();

		$pName = $this->pMod->getName($this->owner_id);

		$respObj->data = ["name" => $pName];
		$respObj->ok();
	}


	public function changename()
	{
		wlog("ProfileApiController::changename()");

		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		$old_name = $this->pMod->getName($this->owner_id);
		$new_name = $_POST["name"];

		if ($old_name == $new_name)
			$respObj->fail(getMessage(ERR_PROFILE_NAME));

		if (!$this->pMod->edit($this->owner_id, $new_name))
			$respObj->fail(getMessage(ERR_PROFILE_NAME));

		$respObj->msg = getMessage(MSG_PROFILE_NAME);
		$respObj->data = ["name" => $new_name];

		$respObj->ok();
	}


	public function changepass()
	{
		wlog("ProfileApiController::changepass()");

		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["oldpwd"]) || !isset($_POST["newpwd"]))
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		$login = $this->uMod->getLogin($this->user_id);
		if (!$this->uMod->changePassword($login, $_POST["oldpwd"], $_POST["newpwd"]))
			$respObj->fail(getMessage(ERR_PROFILE_PASSWORD));

		$respObj->msg = getMessage(MSG_PROFILE_PASSWORD);

		$respObj->ok();
	}


	public function reset()
	{
		wlog("ProfileApiController::reset()");

		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		$accMod = new AccountModel($this->user_id);
		if (!$accMod->reset())
			$this->fail(getMessage(ERR_PROFILE_RESETALL));

		if (!$this->pMod->reset())
			$this->fail(getMessage(ERR_PROFILE_RESETALL));

		$respObj->msg = getMessage(MSG_PROFILE_RESETALL);

		$respObj->ok();
	}
}
