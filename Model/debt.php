<?php

Class DebtModel
{
	private $user_id = 0;
	private $owner_id = 0;		// person of user


	// Class constructor
	public function __construct($user_id)
	{
		global $db;

		$this->user_id = intval($user_id);

		$uMod = new UserModel();
		$this->owner_id = $uMod->getOwner($this->user_id);
	}


	// Create new debt operation
	public function create($op, $acc_id, $p_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $tr_date, $comment)
	{
		if (!is_numeric($p_id) || !is_numeric($src_curr) || !is_numeric($dest_curr))
			return FALSE;

		$account_id = intval($acc_id);
		$person_id = intval($p_id);
		$src_curr = intval($src_curr);
		$dest_curr = intval($dest_curr);
		if (!$person_id || !$src_curr || !$dest_curr)
			return FALSE;

		if ($op != 1 && $op != 2)
			return FALSE;

		$pMod = new PersonModel($this->user_id);
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

		$transMod = new TransactionModel($this->user_id);
		if (!$transMod->create(4, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $tr_date, $comment))
			return FALSE;

		return TRUE;
	}


	// Update debt operation
	public function edit($trans_id, $op, $acc_id, $p_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $tr_date, $comment)
	{
		if (!is_numeric($trans_id) || !is_numeric($p_id) || !is_numeric($src_curr) || !is_numeric($dest_curr))
			return FALSE;

		$tr_id = intval($trans_id);
		$account_id = intval($acc_id);
		$person_id = intval($p_id);
		$src_curr = intval($src_curr);
		$dest_curr = intval($dest_curr);

		if (!$tr_id || !$person_id || !$src_curr || !$dest_curr)
			return FALSE;

		if ($op != 1 && $op != 2)
			return FALSE;

		$pMod = new PersonModel($this->user_id);
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

		$transMod = new TransactionModel($this->user_id);
		if (!$transMod->edit($tr_id, 4, $src_id, $dest_id, $src_amount, $dest_amount, $src_curr, $dest_curr, $tr_date, $comment))
			return FALSE;

		return TRUE;
	}
}
