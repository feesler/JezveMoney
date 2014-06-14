<?php

Class Debt
{
	private $user_id = 0;
	private $owner_id = 0;		// person of user


	// Class constructor
	public function __construct($user_id)
	{
		global $db;

		$this->user_id = intval($user_id);

		$u = new User();
		$this->owner_id = $u->getOwner($this->user_id);
/*
		$resArr = $db->selectQ("owner_id", "users", "id=".$this->user_id);
		if (count($resArr) == 1)
		{
			$this->owner_id = intval($resArr[0]["owner_id"]);
		}
*/
	}


	// Create new debt operation
	public function create($op, $acc_id, $p_id, $amount, $charge, $curr_id, $tr_date, $comment)
	{
		if (!is_numeric($p_id) || !is_numeric($curr_id))
			return FALSE;

		$account_id = intval($acc_id);
		$person_id = intval($p_id);
		$curr_id = intval($curr_id);

		if (!$person_id || !$curr_id)
			return FALSE;

		$person = new Person($this->user_id);
		if (!$person->is_exist($person_id))
			return FALSE;

		$p_acc = $person->getAccount($person_id, $curr_id);
		if (!$p_acc)
			$p_acc = $person->createAccount($person_id, $curr_id);
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

		$trans = new Transaction($this->user_id);
		if (!$trans->create(4, $src_id, $dest_id, $amount, $charge, $curr_id, $tr_date, $comment))
			return FALSE;

		return TRUE;
	}


	// Update debt operation
	public function edit($trans_id, $op, $acc_id, $p_id, $amount, $charge, $curr_id, $tr_date, $comment)
	{
		if (!is_numeric($trans_id) || !is_numeric($p_id) || !is_numeric($curr_id))
			return FALSE;

		$tr_id = intval($trans_id);
		$account_id = intval($acc_id);
		$person_id = intval($p_id);
		$curr_id = intval($curr_id);

		if (!$tr_id || !$person_id || !$curr_id)
			return FALSE;

		$person = new Person($this->user_id);
		if (!$person->is_exist($person_id))
			return FALSE;

		$p_acc = $person->getAccount($person_id, $curr_id);
		if (!$p_acc)
			$p_acc = $person->createAccount($person_id, $curr_id);
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

		$trans = new Transaction($this->user_id);
		if (!$trans->edit($tr_id, 4, $src_id, $dest_id, $amount, $charge, $curr_id, $tr_date, $comment))
			return FALSE;

		return TRUE;
	}


	// Return table of current debts
	public function getTable()
	{
		global $db;

		$resStr = "";
		$resStr .= "\t<tr>\r\n\t<td>\r\n\t<table class=\"infotable\">\r\n";

		$resArr = $db->selectQ("p.name AS name, a.curr_id AS curr_id, a.balance AS balance",
							"persons AS p, accounts AS a",
								"p.user_id=".$this->user_id." AND p.id<>".$this->owner_id.
								" AND a.owner_id=p.id AND a.balance<>0");
		if (count($resArr) <= 0)
		{
			$resStr .= "\t\t<tr><td><span>";
			$resStr .= "You have no debts now.";
			$resStr .= "</span></td></tr>\r\n";
		}
		else
		{
			$resStr .= "\t\t<tr><td><b>Person</b></td><td><b>Relation</b></td><td><b>Balance</b></td></tr>\r\n";

			foreach($resArr as $row)
			{
				$acc_bal = floatval($row["balance"]);
				$lend = ($acc_bal < 0);
				$acc_bal = abs($acc_bal);
				$curr_id = intval($row["curr_id"]);
				$balfmt = Currency::format($acc_bal, $curr_id);

				$resStr .= "\t\t<tr><td>".$row["name"]."</td><td>";
				$resStr .= $lend ? "lent" : "borrowed";
				$resStr .= "</td><td>".$balfmt."</td></tr>\r\n";
			}
		}

		$resStr .= "\t</table>\r\n\t</td>\r\n\t</tr>\r\n";

		return $resStr;
	}

}

?>