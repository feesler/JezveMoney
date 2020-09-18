<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Item\Account;


class AccountApiController extends ApiController
{
	protected $requiredFields = [ "name", "initbalance", "curr_id", "icon_id", "flags" ];
	protected $model = NULL;


	public function initAPI()
	{
		parent::initAPI();

		$this->model = AccountModel::getInstance();
	}


	public function index()
	{
		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No account specified");

		$res = [];
		foreach($ids as $acc_id)
		{
			$item = $this->model->getItem($acc_id);
			if (is_null($item))
				$this->fail("Account $acc_id not found");

			$res[] = new Account($item);
		}

		$this->ok($res);
	}


	public function getList()
	{
		$params = [];
		if (isset($_GET["full"]) && $_GET["full"] == 1)
			$params["full"] = TRUE;
		if (isset($_GET["type"]))
			$params["type"] = $_GET["type"];

		$accounts = $this->model->getData($params);
		$res = [];
		foreach($accounts as $item)
		{
			$res[] = new Account($item);
		}

		$this->ok($res);
	}


	public function create()
	{
		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		$reqData = checkFields($request, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		$uObj = $this->uMod->getItem($this->user_id);
		if (!$uObj)
			$this->fail("User not found");

		$reqData["owner_id"] = $uObj->owner_id;

		$acc_id = $this->model->create($reqData);
		if (!$acc_id)
			$this->fail();

		$this->ok([ "id" => $acc_id ]);
	}


	public function update()
	{
		if (!$this->isPOST())
			$this->fail();

		$request = $this->getRequestData();
		if (!$request || !isset($request["id"]))
			$this->fail();

		$reqData = checkFields($request, $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		if (!$this->model->update($request["id"], $reqData))
			$this->fail();

		$this->ok();
	}


	public function del()
	{
		if (!$this->isPOST())
			$this->fail();

		$ids = $this->getRequestedIds(TRUE, $this->isJsonContent());
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No account specified");

		if (!$this->model->del($ids))
			$this->fail();

		$this->ok();
	}


	public function reset()
	{
		if (!$this->model->reset($this->user_id))
			$this->fail();

		$this->ok();
	}
}
