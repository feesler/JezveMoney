<?php

class TransactionApiController extends ApiController
{
	protected $requiredFields = [ "type", "src_id", "dest_id", "src_amount", "dest_amount", "src_curr", "dest_curr", "date", "comment" ];
	protected $debtRequiredFields = [ "type", "person_id", "acc_id", "op", "src_amount", "dest_amount", "src_curr", "dest_curr", "date", "comment" ];


	public function initAPI()
	{
		parent::initAPI();

		$this->model = TransactionModel::getInstance();
	}


	public function index()
	{
		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No transaction specified");

		$res = [];
		foreach($ids as $trans_id)
		{
			$item = $this->model->getItem($trans_id);
			if (is_null($item))
				$this->fail("Transaction $trans_id not found");

			$res[] = new Transaction($item);
		}

		$this->ok($res);
	}


	public function getList()
	{
		$accMod = AccountModel::getInstance();

		$params = [];

		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$params["type"] = TransactionModel::getStringType($type_str);
		if (is_null($params["type"]))
			$this->fail();

		$params["onPage"] = (isset($_GET["count"]) && is_numeric($_GET["count"])) ? intval($_GET["count"]) : 10;

		$params["page"] = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

		$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
		if (!$accMod->is_exist($acc_id))
			$acc_id = 0;
		if ($acc_id != 0)
			$params["accounts"] = $acc_id;

		if (isset($_GET["search"]))
			$params["search"] = $_GET["search"];

		if (isset($_GET["stdate"]) && isset($_GET["enddate"]))
		{
			$params["startDate"] = $_GET["stdate"];
			$params["endDate"] = $_GET["enddate"];
		}

		$items = $this->model->getData($params);
		$res = [];
		foreach($items as $item)
		{
			$res[] = new Transaction($item);
		}

		$this->ok($res);
	}


	public function create()
	{
		if (!$this->isPOST())
			$this->fail();

		if (!isset($_POST["type"]))
			$this->fail();

		$trans_type = intval($_POST["type"]);

		$reqData = checkFields($_POST, ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		$trans_id = 0;
		if ($trans_type == DEBT)
		{
			$debtMod = DebtModel::getInstance();
			$trans_id = $debtMod->create($reqData);
		}
		else
		{
			$trans_id = $this->model->create($reqData);
		}

		if (!$trans_id)
			$this->fail();

		$this->ok([ "id" => $trans_id ]);
	}


	public function createMultiple()
	{
		if (!$this->isPOST())
			$this->fail();

		$request = $this->getJSONContent(TRUE);
		$transactions = [];
		foreach($request as $item)
		{
			if ($item["type"] == DEBT)
			{
				$debtModel = DebtModel::getInstance();
				$debtTrans = $debtModel->prepareTransaction($item);
				$transObj = (array)$debtTrans;
			}
			else
			{
				$transObj = $item;
			}

			$transactions[] = $transObj;
		}

		$trans_ids = $this->model->createMultiple($transactions);
		if (!$trans_ids)
			$this->fail();

		$this->ok([ "ids" => $trans_ids ]);
	}


	public function update()
	{
		if (!$this->isPOST())
			$this->fail();

		if (!isset($_POST["id"]))
			$this->fail();

		$trans_id = intval($_POST["id"]);
		$trans_type = intval($_POST["type"]);

		$reqData = checkFields($_POST, ($trans_type == DEBT) ? $this->debtRequiredFields : $this->requiredFields);
		if ($reqData === FALSE)
			$this->fail();

		if ($trans_type == DEBT)
		{
			$debtMod = DebtModel::getInstance();
			if (!$debtMod->update($trans_id, $reqData))
				$this->fail();
		}
		else
		{
			if (!$this->model->update($trans_id, $reqData))
				$this->fail();
		}

		$this->ok();
	}


	public function del()
	{
		if (!$this->isPOST())
			$this->fail();

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$this->fail("No account specified");

		if (!$this->model->del($ids))
			$this->fail();

		$this->ok();
	}


	public function setPos()
	{
		if (!$this->isPOST())
			$this->fail();

		$reqData = checkFields($_POST, ["id", "pos"]);
		if ($reqData === FALSE)
			$this->fail();

		if (!$this->model->updatePosition($reqData["id"], $reqData["pos"]))
			$this->fail();

		$this->ok();
	}
}
