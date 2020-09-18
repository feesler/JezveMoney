<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\Singleton;
use JezveMoney\App\Model\TransactionModel;


class DebtModel
{
	use Singleton;

	protected $personModel = NULL;
	protected $accModel = NULL;


	protected function onStart()
	{
		$this->personModel = PersonModel::getInstance();
		$this->accModel = AccountModel::getInstance();
	}


	// Convert debt specific params to transaction object
	public function prepareTransaction($params)
	{
		$mandatoryParams = ["person_id", "op", "src_amount", "dest_amount", "src_curr", "dest_curr", "date", "comment"];

		checkFields($params, $mandatoryParams, TRUE);

		$res = new \stdClass;
		$res->type = DEBT;

		if (isset($params["id"]))
			$res->id = intval($params["id"]);

		$op = intval($params["op"]);
		if ($op != 1 && $op != 2)
			throw new \Error("Unknown debt operation: $op");

		$person_id = intval($params["person_id"]);

		$res->src_curr = intval($params["src_curr"]);
		$res->dest_curr = intval($params["dest_curr"]);
		if (!$res->src_curr || !$res->dest_curr)
			throw new \Error("Invalid currency");

		$curr_id = ($op == 1) ? $res->src_curr : $res->dest_curr;
		$personAccount = $this->accModel->getPersonAccount($person_id, $curr_id);
		if (!$personAccount)
			$personAccount = $this->accModel->createPersonAccount($person_id, $curr_id);
		if (!$personAccount)
			throw new \Error("Fail to obtain person account: person_id: $person_id, curr_id: $curr_id");

		$account_id = isset($params["acc_id"]) ? intval($params["acc_id"]) : 0;

		if ($op == 1)		// give
		{
			$res->src_id = $personAccount->id;
			$res->dest_id = $account_id;
		}
		else if ($op == 2)	// take
		{
			$res->src_id = $account_id;
			$res->dest_id = $personAccount->id;
		}

		$res->src_amount = floatval($params["src_amount"]);
		$res->dest_amount = floatval($params["dest_amount"]);
		if ($res->src_amount == 0.0 || $res->dest_amount == 0.0)
			throw new \Error("Invalid amount");

		$res->date = $params["date"];
		$res->comment = $params["comment"];

		return $res;
	}


	// Create new debt operation
	public function create($params)
	{
		$op = intval($params["op"]);

		$account_id = intval($params["acc_id"]);
		$person_id = intval($params["person_id"]);
		$src_curr = intval($params["src_curr"]);
		$dest_curr = intval($params["dest_curr"]);
		$src_amount = floatval($params["src_amount"]);
		$dest_amount = floatval($params["dest_amount"]);
		$tr_date = $params["date"];
		$comment = $params["comment"];
		if (!$person_id || !$src_curr || !$dest_curr)
			return 0;

		if ($op != 1 && $op != 2)
			return 0;

		$personAccount = $this->accModel->getPersonAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$personAccount)
			$personAccount = $this->accModel->createPersonAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$personAccount)
			return 0;

		if ($op == 1)		// give
		{
			$src_id = $personAccount->id;
			$dest_id = $account_id;
		}
		else if ($op == 2)	// take
		{
			$src_id = $account_id;
			$dest_id = $personAccount->id;
		}

		$transMod = TransactionModel::getInstance();
		$trans_id = $transMod->create([ "type" => DEBT,
										"src_id" => $src_id,
										"dest_id" => $dest_id,
										"src_amount" => $src_amount,
										"dest_amount" => $dest_amount,
										"src_curr" => $src_curr,
										"dest_curr" => $dest_curr,
										"date" => $tr_date,
										"comment" => $comment ]);

		return $trans_id;
	}


	// Update debt operation
	public function update($trans_id, $params)
	{
		$tr_id = intval($trans_id);
		$op = intval($params["op"]);
		$account_id = intval($params["acc_id"]);
		$person_id = intval($params["person_id"]);
		$src_curr = intval($params["src_curr"]);
		$dest_curr = intval($params["dest_curr"]);
		$src_amount = floatval($params["src_amount"]);
		$dest_amount = floatval($params["dest_amount"]);
		$tr_date = $params["date"];
		$comment = $params["comment"];
		if (!$tr_id || !$person_id || !$src_curr || !$dest_curr)
			return FALSE;

		if ($op != 1 && $op != 2)
			return FALSE;

		$personAccount = $this->accModel->getPersonAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$personAccount)
			$personAccount = $this->accModel->createPersonAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$personAccount)
			return FALSE;

		if ($op == 1)		// give
		{
			$src_id = $personAccount->id;
			$dest_id = $account_id;
		}
		else if ($op == 2)	// take
		{
			$src_id = $account_id;
			$dest_id = $personAccount->id;
		}

		$transMod = TransactionModel::getInstance();
		if (!$transMod->update($tr_id, [ "type" => DEBT,
										"src_id" => $src_id,
										"dest_id" => $dest_id,
										"src_amount" => $src_amount,
										"dest_amount" => $dest_amount,
										"src_curr" => $src_curr,
										"dest_curr" => $dest_curr,
										"date" => $tr_date,
										"comment" => $comment ]))
			return FALSE;

		return TRUE;
	}
}
