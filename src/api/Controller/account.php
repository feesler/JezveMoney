<?php

class AccountApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->accMod = new AccountModel($this->user_id);
	}


	public function index()
	{
		$respObj = new apiResponse();

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No account specified");

		$res = [];
		foreach($ids as $acc_id)
		{
			$props = $this->accMod->getProperties($acc_id);
			if (is_null($props))
				$respObj->fail("Account not found");

			$res[] = $props;
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse();

		$respObj->data = $this->accMod->getArray();
		$respObj->ok();
	}


	public function create()
	{
		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["name"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$respObj->fail();

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$respObj->fail("User not found");

		$owner_id = $uObj->owner_id;
		wlog("owner: ".$owner_id);

		$acc_id = $this->accMod->create([ "owner_id" => $owner_id,
											"name" => $_POST["name"],
											"balance" => $_POST["balance"],
											"curr_id" => $_POST["currency"],
											"icon" => $_POST["icon"] ]);
		if (!$acc_id)
			$respObj->fail();

		$respObj->data = ["id" => $acc_id];
		$respObj->ok();
	}


	public function update()
	{
		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["id"]) || !isset($_POST["name"]) || !isset($_POST["balance"]) || !isset($_POST["currency"]) || !isset($_POST["icon"]))
			$respObj->fail();

		if (!$this->accMod->update($_POST["id"], [ "name" => $_POST["name"],
													"balance" => $_POST["balance"],
													"curr_id" => $_POST["currency"],
													"icon" => $_POST["icon"] ]))
			$respObj->fail();

		$respObj->ok();
	}


	public function del()
	{
		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No account specified");

		foreach($ids as $acc_id)
		{
			$acc_id = intval($acc_id);
			if (!$acc_id)
				continue;

			if (!$this->accMod->del($acc_id))
				$respObj->fail();
		}

		$respObj->ok();
	}


	public function reset()
	{
		$respObj = new apiResponse();

		if (!$this->accMod->reset())
			$respObj->fail();

		$respObj->ok();
	}

}
