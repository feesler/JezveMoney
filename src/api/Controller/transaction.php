<?php

class TransactionApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->model = TransactionModel::getInstance();
	}


	public function index()
	{
		$respObj = new apiResponse;

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No transaction specified");

		$res = [];
		foreach($ids as $trans_id)
		{
			$props = $this->model->getProperties($trans_id);
			if (is_null($props))
				$respObj->fail("Transaction ".$trans_id." not found");

			$res[] = $props;
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		$respObj = new apiResponse;

		$accMod = AccountModel::getInstance();

		$params = [];

		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$params["type"] = TransactionModel::getStringType($type_str);
		if (is_null($params["type"]))
			$respObj->fail();

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

		$trArr = $this->model->getData($params);

		$respObj->data = [];
		foreach($trArr as $trans)
		{
			$tr = new stdClass;
			$tr->id = $trans->id;
			$tr->type = $trans->type;
			$tr->src_id = $trans->src_id;
			$tr->dest_id = $trans->dest_id;
			$tr->src_amount = $trans->src_amount;
			$tr->dest_amount = $trans->dest_amount;
			$tr->src_curr = $trans->src_curr;
			$tr->dest_curr = $trans->dest_curr;
			$tr->date = $trans->date;
			$tr->comment = $trans->comment;
			$tr->pos = $trans->pos;

			$respObj->data[] = $tr;
		}

		$respObj->ok();
	}


	public function create()
	{
		$db = mysqlDB::getInstance();

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		$trans_type = intval($_POST["transtype"]);

		if ($trans_type == DEBT)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				$respObj->fail();

			$pers = PersonModel::getInstance();
			if (!$pers->is_exist($person_id))		// person should exist
				$respObj->fail();

			$debtMod = DebtModel::getInstance();
		}
		else
		{
			$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
			$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
		}
		$src_amount = floatval($_POST["src_amount"]);
		$dest_amount = floatval($_POST["dest_amount"]);
		$src_curr = (isset($_POST["src_curr"])) ? intval($_POST["src_curr"]) : 0;
		$dest_curr = (isset($_POST["dest_curr"])) ? intval($_POST["dest_curr"]) : 0;
		$trdate = strtotime($_POST["date"]);
		$fdate = date("Y-m-d H:i:s", $trdate);
		$comment = $db->escape($_POST["comm"]);

		if ($src_amount == 0.0 || $dest_amount == 0.0 || $trdate == -1)
			$respObj->fail();


		if ($trans_type == DEBT)
		{
			$trans_id = $debtMod->create([ "op" => $debt_op,
											"acc_id" => $acc_id,
											"person_id" => $person_id,
											"src_amount" => $src_amount,
											"dest_amount" => $dest_amount,
											"src_curr" => $src_curr,
											"dest_curr" => $dest_curr,
											"date" => $fdate,
											"comment" => $comment ]);
			if (!$trans_id)
				$respObj->fail();

			$respObj->data = ["id" => $trans_id];
		}
		else
		{
			if ($trans_type == EXPENSE && (!$src_id || !$src_curr || !$dest_curr))
				$respObj->fail();
			if ($trans_type == INCOME && (!$dest_id || !$src_curr || !$dest_curr))
				$respObj->fail();
			if ($trans_type == TRANSFER && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				$respObj->fail();

			$trans_id = $this->model->create([ "type" => $trans_type,
												"src_id" => $src_id,
												"dest_id" => $dest_id,
												"src_amount" => $src_amount,
												"dest_amount" => $dest_amount,
												"src_curr" => $src_curr,
												"dest_curr" => $dest_curr,
												"date" => $fdate,
												"comment" => $comment ]);
			if (!$trans_id)
				$respObj->fail();

			$respObj->data = ["id" => $trans_id];
		}

		$respObj->ok();
	}


	public function update()
	{
		$db = mysqlDB::getInstance();

		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["transid"]))
					$respObj->fail();
		$trans_id = intval($_POST["transid"]);

		$trans_type = intval($_POST["transtype"]);

		if ($trans_type == DEBT)
		{
			$debt_op = (isset($_POST["debtop"])) ? intval($_POST["debtop"]) : 0;
			$person_id = (isset($_POST["person_id"])) ? intval($_POST["person_id"]) : 0;
			$acc_id = (isset($_POST["acc_id"])) ? intval($_POST["acc_id"]) : 0;

			if (($debt_op != 1 && $debt_op != 2) || !$person_id)
				$respObj->fail();

			$pers = PersonModel::getInstance();
			if (!$pers->is_exist($person_id))		// person should exist
				$respObj->fail();

			$debtMod = DebtModel::getInstance();
		}
		else
		{
			$src_id = (isset($_POST["src_id"])) ? intval($_POST["src_id"]) : 0;
			$dest_id = (isset($_POST["dest_id"])) ? intval($_POST["dest_id"]) : 0;
		}
		$src_amount = floatval($_POST["src_amount"]);
		$dest_amount = floatval($_POST["dest_amount"]);
		$src_curr = (isset($_POST["src_curr"])) ? intval($_POST["src_curr"]) : 0;
		$dest_curr = (isset($_POST["dest_curr"])) ? intval($_POST["dest_curr"]) : 0;
		$trdate = strtotime($_POST["date"]);
		$fdate = date("Y-m-d H:i:s", $trdate);
		$comment = $db->escape($_POST["comm"]);

		if ($src_amount == 0.0 || $dest_amount == 0.0 || $trdate == -1)
			$respObj->fail();

		if ($trans_type == DEBT)
		{
			if (!$debtMod->update($trans_id, [ "op" => $debt_op,
												"acc_id" => $acc_id,
												"person_id" => $person_id,
												"src_amount" => $src_amount,
												"dest_amount" => $dest_amount,
												"src_curr" => $src_curr,
												"dest_curr" => $dest_curr,
												"date" => $fdate,
												"comment" => $comment ]))
				$respObj->fail();
		}
		else
		{
			if (!$this->model->update($trans_id, [ "type" => $trans_type,
												"src_id" => $src_id,
												"dest_id" => $dest_id,
												"src_amount" => $src_amount,
												"dest_amount" => $dest_amount,
												"src_curr" => $src_curr,
												"dest_curr" => $dest_curr,
												"date" => $fdate,
												"comment" => $comment ]))
				$respObj->fail();
		}
		$ttStr = TransactionModel::getTypeString($trans_type);
		if (is_null($ttStr))
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


	public function setPos()
	{
		$respObj = new apiResponse;

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["id"]) || !is_numeric($_POST["id"]) ||
			!isset($_POST["pos"]) || !is_numeric($_POST["pos"]))
			$respObj->fail();

		$tr_id = intval($_POST["id"]);
		$to_pos = intval($_POST["pos"]);
		if (!$tr_id || !$to_pos)
			$respObj->fail();

		if (!$this->model->updatePos($tr_id, $to_pos))
			$respObj->fail();

		$respObj->ok();
	}
}
