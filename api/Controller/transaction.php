<?php

class TransactionApiController extends ApiController
{
	public function initAPI()
	{
		parent::initAPI();

		$this->trMod = new TransactionModel($this->user_id);
	}


	public function index()
	{
		wlog("TransactionApiController::index()");

		$respObj = new apiResponse();

		$ids = $this->getRequestedIds();
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No transaction specified");

		$res = [];
		foreach($ids as $trans_id)
		{
			$props = $this->trMod->getProperties($trans_id);
			if (is_null($props))
				$respObj->fail("Transaction ".$trans_id." not found");

			$res[] = $props;
		}

		$respObj->data = $res;
		$respObj->ok();
	}


	public function getList()
	{
		wlog("TransactionApiController::getList()");

		$respObj = new apiResponse();


		$accMod = new AccountModel($this->user_id);

		$type_str = (isset($_GET["type"])) ? $_GET["type"] : "all";

		$trans_type = TransactionModel::getStringType($type_str);
		if (is_null($trans_type))
			$respObj->fail();

		$tr_on_page = (isset($_GET["count"]) && is_numeric($_GET["count"])) ? intval($_GET["count"]) : 10;

		$page_num = (isset($_GET["page"]) && is_numeric($_GET["page"])) ? (intval($_GET["page"]) - 1) : 0;

		$acc_id = (isset($_GET["acc_id"])) ? intval($_GET["acc_id"]) : 0;
		if ($acc_id && !$accMod->is_exist($acc_id))
			$acc_id = 0;

		$searchReq = (isset($_GET["search"]) ? $_GET["search"] : NULL);

		$stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : NULL);
		$endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : NULL);

		$trArr = $this->trMod->getArray($trans_type, $acc_id, TRUE, $tr_on_page, $page_num, $searchReq, $stDate, $endDate, FALSE);

		wlog("trArr: ".var_export($trArr, TRUE));

		$respObj->data = array();
		foreach($trArr as $trans)
		{
			$tr = new stdClass;
			$tr->id = $trans->id;
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
		global $db;

		wlog("TransactionApiController::create()");

		$respObj = new apiResponse();

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

			$pers = new PersonModel($this->user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				$respObj->fail();

			$debtMod = new DebtModel($this->user_id);
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
			if (!$debtMod->create($debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$respObj->fail();
		}
		else
		{
			if ($trans_type == EXPENSE && (!$src_id || !$src_curr || !$dest_curr))
				$respObj->fail();
			if ($trans_type == INCOME && (!$dest_id || !$src_curr || !$dest_curr))
				$respObj->fail();
			if ($trans_type == TRANSFER && (!$src_id || !$dest_id || !$src_curr || !$dest_id))
				$respObj->fail();

			$trans_id = $this->trMod->create($trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment);
			if (!$trans_id)
				$respObj->fail();

			$respObj->data = array("id" => $trans_id);
		}

		$respObj->ok();
	}


	public function update()
	{
		global $db;

		wlog("TransactionApiController::update()");

		$respObj = new apiResponse();

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

			$pers = new PersonModel($this->user_id);
			if (!$pers->is_exist($person_id))		// person should exist
				$respObj->fail();

			$debtMod = new DebtModel($this->user_id);
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
			if (!$debtMod->edit($trans_id, $debt_op, $acc_id, $person_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$respObj->fail();
		}
		else
		{
			if (!$this->trMod->edit($trans_id, $trans_type, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $fdate, $comment))
				$respObj->fail();
		}
		$ttStr = TransactionModel::getTypeString($trans_type);
		if (is_null($ttStr))
			$respObj->fail();

		$respObj->ok();
	}



	public function del()
	{
		wlog("TransactionApiController::del()");

		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		$ids = $this->getRequestedIds(TRUE);
		if (is_null($ids) || !is_array($ids) || !count($ids))
			$respObj->fail("No account specified");

		foreach($ids as $trans_id)
		{
			$trans_id = intval($trans_id);
			if (!$trans_id)
				continue;

			if (!$this->trMod->del($trans_id))
				$respObj->fail();
		}

		$respObj->ok();
	}


	public function setPos()
	{
		wlog("TransactionApiController::setPos()");

		$respObj = new apiResponse();

		if (!$this->isPOST())
			$respObj->fail();

		if (!isset($_POST["id"]) || !is_numeric($_POST["id"]) ||
			!isset($_POST["pos"]) || !is_numeric($_POST["pos"]))
			$respObj->fail();

		$tr_id = intval($_POST["id"]);
		$to_pos = intval($_POST["pos"]);
		if (!$tr_id || !$to_pos)
			$respObj->fail();

		if (!$this->trMod->updatePos($tr_id, $to_pos))
			$respObj->fail();

		$respObj->ok();
	}
}
