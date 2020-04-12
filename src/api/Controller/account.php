<?php

class AccountApiController extends ApiController
{
	protected $requiredFields = [ "name", "initbalance", "curr_id", "icon" ];


	public function initAPI()
	{
		parent::initAPI();

		$this->model = AccountModel::getInstance();
	}


	public function index()
	{
		$respObj = new apiResponse;

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No account specified");

		$res = [];
		foreach($ids as $acc_id)
		{
			$item = $this->model->getItem($acc_id);
			if (is_null($item))
				$respObj->fail("Account not found");

			$res[] = $item;
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse;

		$params = [];
		if (isset($_GET["full"]) && $_GET["full"] == 1)
			$params["full"] = TRUE;

		$respObj->data = $this->model->getData($params);
		$respObj->ok();
	}


	public function create()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$respObj->fail();

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$respObj->fail("User not found");

		$reqData["owner_id"] = $uObj->owner_id;

		$acc_id = $this->model->create($reqData);
		if (!$acc_id)
			$respObj->fail();

		$respObj->data = ["id" => $acc_id];
		$respObj->ok();
	}


	public function update()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["id"]))
			$respObj->fail();

		$reqData = checkFields($_POST, $this->requiredFields);
		if ($reqData === FALSE)
			$respObj->fail();

		if (!$this->model->update($_POST["id"], $reqData))
			$respObj->fail();

		$respObj->ok();
	}


	public function del()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No account specified");

		if (!$this->model->del($ids))
			$respObj->fail();

		$respObj->ok();
	}


	public function reset()
	{
		$respObj = new apiResponse;

		if (!$this->model->reset($this->user_id))
			$respObj->fail();

		$respObj->ok();
	}

}
