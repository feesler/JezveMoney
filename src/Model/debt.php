<?php

class DebtModel
{
	use Singleton;

	private $user_id = 0;
	private $owner_id = 0;		// person of user


	protected function onStart()
	{
		$uMod = UserModel::getInstance();
		if (!$uMod->currentUser)
			throw new Error("User not found");

		$this->user_id = $uMod->currentUser->id;
		$this->owner_id = $uMod->currentUser->owner_id;
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

		$pMod = PersonModel::getInstance();
		if (!$pMod->is_exist($person_id))
			return 0;

		$p_acc = $pMod->getAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$p_acc)
			$p_acc = $pMod->createAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$p_acc)
			return 0;

		if ($op == 1)		// give
		{
			$src_id = $p_acc;
			$dest_id = $account_id;
		}
		else if ($op == 2)	// take
		{
			$src_id = $account_id;
			$dest_id = $p_acc;
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

		$pMod = PersonModel::getInstance();
		if (!$pMod->is_exist($person_id))
			return FALSE;

		$p_acc = $pMod->getAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$p_acc)
			$p_acc = $pMod->createAccount($person_id, ($op == 1) ? $src_curr : $dest_curr);
		if (!$p_acc)
			return FALSE;

		if ($op == 1)		// give
		{
			$src_id = $p_acc;
			$dest_id = $account_id;
		}
		else if ($op == 2)	// take
		{
			$src_id = $account_id;
			$dest_id = $p_acc;
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
