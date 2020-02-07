<?php

class TransactionModel extends CachedTable
{
	use Singleton;

	static private $dcache = NULL;
	static private $user_id = 0;
	static private $typeStrArr = [0 => "all", EXPENSE => "expense", INCOME => "income", TRANSFER => "transfer", DEBT => "debt"];


	protected function onStart()
	{
		$this->tbl_name = "transactions";
		$this->dbObj = mysqlDB::getInstance();
		if (!$this->dbObj->isTableExist($this->tbl_name))
			$this->createTable();

		$uMod = UserModel::getInstance();
		if (!$uMod->currentUser)
			throw new Error("User not found");

		self::$user_id = $uMod->currentUser->id;

		$this->accModel = AccountModel::getInstance();
		$this->currMod = CurrencyModel::getInstance();
	}


	// Create DB table if not exist
	private function createTable()
	{
		$res = $this->dbObj->createTableQ($this->tbl_name,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`user_id` INT(11) NOT NULL, ".
						"`src_id` INT(11) NOT NULL, ".
						"`dest_id` INT(11) NOT NULL, ".
						"`type` INT(11) NOT NULL, ".
						"`src_amount` DECIMAL(15,2) NOT NULL, ".
						"`dest_amount` DECIMAL(15,2) NOT NULL, ".
						"`src_curr` INT(11) NOT NULL, ".
						"`dest_curr` INT(11) NOT NULL, ".
						"`date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, ".
						"`comment` text NOT NULL, ".
						"`pos` INT(11) NOT NULL, ".
						"`createdate` DATETIME NOT NULL, ".
						"`updatedate` DATETIME NOT NULL, ".
						"`src_result` DECIMAL(15,2) NOT NULL, ".
						"`dest_result` DECIMAL(15,2) NOT NULL, ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARACTER SET = utf8 COLLATE utf8mb4_general_ci");

		return $res;
	}


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return self::$dcache;
	}


	// Convert DB row to item object
	protected function rowToObj($row)
	{
		if (is_null($row))
			return NULL;

		$res = new stdClass;
		$res->id = intval($row["id"]);
		$res->user_id = intval($row["user_id"]);
		$res->src_id = intval($row["src_id"]);
		$res->dest_id = intval($row["dest_id"]);
		$res->type = intval($row["type"]);
		$res->src_amount = floatval($row["src_amount"]);
		$res->dest_amount = floatval($row["dest_amount"]);
		$res->src_result = floatval($row["src_result"]);
		$res->dest_result = floatval($row["dest_result"]);
		$res->src_curr = intval($row["src_curr"]);
		$res->dest_curr = intval($row["dest_curr"]);
		$res->date = strtotime($row["date"]);
		$res->comment = $row["comment"];
		$res->pos = intval($row["pos"]);
		$res->createdate = strtotime($row["createdate"]);
		$res->updatedate = strtotime($row["updatedate"]);

		return $res;
	}


	// Called from CachedTable::updateCache() and return data query object
	protected function dataQuery()
	{
		return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=".self::$user_id, NULL, "pos ASC");
	}


	protected function checkParams($params, $isUpdate = FALSE)
	{
		$avFields = ["type", "src_id", "dest_id", "src_amount", "dest_amount", "src_curr", "dest_curr", "date", "comment"];
		$avTypes = [EXPENSE, INCOME, TRANSFER, DEBT];
		$res = [];

		// In CREATE mode all fields is required
		if (!$isUpdate && !checkFields($params, $avFields))
			return NULL;

		if (isset($params["type"]))
		{
			$res["type"] = intval($params["type"]);
			if (!in_array($res["type"], $avTypes))
			{
				wlog("Invalid type specified");
				return NULL;
			}
		}

		if (isset($params["src_id"]))
		{
			$res["src_id"] = intval($params["src_id"]);
			if ((($res["type"] == EXPENSE || $res["type"] == TRANSFER) && !$res["src_id"]) ||
				($res["type"] == INCOME && $res["src_id"] != 0))
			{
				wlog("Invalid src_id specified");
				return NULL;
			}
		}

		if (isset($params["dest_id"]))
		{
			$res["dest_id"] = intval($params["dest_id"]);
			if (($res["type"] == EXPENSE && $res["dest_id"] != 0) ||
				(($res["type"] == INCOME || $res["type"] == TRANSFER) && !$res["dest_id"]))
			{
				wlog("Invalid dest_id specified");
				return NULL;
			}
		}

		if (isset($params["src_amount"]))
		{
			$res["src_amount"] = floatval($params["src_amount"]);
			if ($res["src_amount"] == 0.0)
			{
				wlog("Invalid src_amount specified");
				return NULL;
			}
		}

		if (isset($params["dest_amount"]))
		{
			$res["dest_amount"] = floatval($params["dest_amount"]);
			if ($res["dest_amount"] == 0.0)
			{
				wlog("Invalid dest_amount specified");
				return NULL;
			}
		}

		if (isset($params["src_curr"]))
		{
			$res["src_curr"] = intval($params["src_curr"]);
			if (!$this->currMod->is_exist($res["src_curr"]))
			{
				wlog("Invalid src_curr specified");
				return NULL;
			}
		}

		if (isset($params["dest_curr"]))
		{
			$res["dest_curr"] = intval($params["dest_curr"]);
			if (!$this->currMod->is_exist($res["dest_curr"]))
			{
				wlog("Invalid dest_curr specified");
				return NULL;
			}
		}

		if (isset($params["date"]))
		{
			$res["date"] = strtotime($params["date"]);
			if ($res["date"] === FALSE)
			{
				wlog("Invalid date specified");
				return NULL;
			}
		}

		if (isset($params["comment"]))
			$res["comment"] = $this->dbObj->escape($params["comment"]);

		return $res;
	}


	// Preparations for item create
	protected function preCreate($params, $isMultiple = FALSE)
	{
		$res = $this->checkParams($params);
		if (is_null($res))
			return NULL;

		$uMod = UserModel::getInstance();

		if (!isset($this->balanceChanges))
			$this->balanceChanges = [];

		$this->balanceChanges = $this->applyTransaction($res, $this->balanceChanges);

		// check target date is today
		$today_date = getdate();
		$target_date = getdate($res["date"]);
		$today_time = mktime(0, 0, 0, $today_date["mon"], $today_date["mday"], $today_date["year"]);
		$target_time = mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]);

		if ($today_time > $target_time)
		{
			$res["pos"] = 0;
		}
		else
		{
			if ($isMultiple)
			{
				if (!isset($this->latestPos))
				{
					$this->latestPos = $this->getLatestPos();
				}
				$res["pos"] = (++$this->latestPos);
			}
			else
			{
				$res["pos"] = $this->getLatestPos() + 1;
			}
		}

		$res["date"] = date("Y-m-d H:i:s", $res["date"]);
		$res["src_result"] = ($res["src_id"] != 0) ? $this->balanceChanges[ $res["src_id"] ] : 0;
		$res["dest_result"] = ($res["dest_id"] != 0) ? $this->balanceChanges[ $res["dest_id"] ] : 0;
		$res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
		$res["user_id"] = self::$user_id;

		return $res;
	}


	protected function postCreate($items)
	{
		$this->cleanCache();

		if (!is_array($items))
			$items = [ $items ];

		// Commit balance changes for affected accounts
		$this->accModel->updateBalances($this->balanceChanges);
		unset($this->balanceChanges);
		unset($this->latestPos);

		foreach($items as $item_id)
		{
			$trObj = $this->getItem($item_id);
			if (!$trObj)
				return;

			// Update position of transaction if target date is not today
			if ($trObj->pos === 0)
			{
				$latest_pos = $this->getLatestPos($trObj->date);
				$this->updatePos($item_id, $latest_pos + 1);
			}
		}
	}


	public function pushBalance($account_id, $accountsList = [])
	{
		$res = $accountsList;

		if (!$account_id)
			return $res;

		if (!isset($res[$account_id]))
		{
			$account = $this->accModel->getItem($account_id);
			if ($account)
				$res[$account_id] = $account->balance;
			else
				$res[$account_id] = 0;
		}

		return $res;
	}


	// Apply specified transaction to the list of accounts and return new state
	// If accounts list not specified returns only impact of transaction
	public function applyTransaction($trans, $accountsList = [])
	{
		if (!$trans)
			throw new Error("Invalid Transaction object");

		$trans = (object)$trans;
		$res = $accountsList;

		if ($trans->src_id != 0)
		{
			$res = $this->pushBalance($trans->src_id, $res);
			$res[ $trans->src_id ] = round($res[ $trans->src_id ] - $trans->src_amount, 2);
		}

		if ($trans->dest_id != 0)
		{
			$res = $this->pushBalance($trans->dest_id, $res);
			$res[ $trans->dest_id ] = round($res[ $trans->dest_id ] + $trans->dest_amount, 2);
		}

		return $res;
	}


	// Cancel changes by specified transaction on list of accounts and return new state
	// If accounts list not specified returns only cancel of transaction impact
	public function cancelTransaction($trans, $accountsList = [])
	{
		if (!$trans)
			throw new Error("Invalid Transaction object");

		$trans = (object)$trans;
		$res = $accountsList;

		if ($trans->src_id != 0)
		{
			$res = $this->pushBalance($trans->src_id, $res);
			$res[ $trans->src_id ] = round($res[ $trans->src_id ] + $trans->src_amount, 2);
		}

		if ($trans->dest_id != 0)
		{
			$res = $this->pushBalance($trans->dest_id, $res);
			$res[ $trans->dest_id ] = round($res[ $trans->dest_id ] - $trans->dest_amount, 2);
		}

		return $res;
	}


	// Preparations for item update
	protected function preUpdate($item_id, $params)
	{
		// check transaction is exist
		$trObj = $this->getItem($item_id);
		if (!$trObj)
			return FALSE;

		// check user of transaction
		if ($trObj->user_id != self::$user_id)
			return FALSE;

		$res = $this->checkParams($params, TRUE);
		if (is_null($res))
			return NULL;

		$this->originalTrans = $trObj;

		$canceled = $this->cancelTransaction($trObj);
		$this->balanceChanges = $this->applyTransaction($res, $canceled);

		// check date is changed
		$orig_date = getdate($trObj->date);
		$target_date = getdate($res["date"]);

		$orig_time = mktime(0, 0, 0, $orig_date["mon"], $orig_date["mday"], $orig_date["year"]);
		$target_time = mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]);

		if ($orig_time != $target_time)
		{
			$res["pos"] = 0;
		}
		else
		{
			$res["pos"] = $trObj->pos;
		}

		if (isset($res["date"]))
			$res["date"] = date("Y-m-d H:i:s", $res["date"]);
		$res["src_result"] = ($res["src_id"] != 0) ? $this->balanceChanges[ $res["src_id"] ] : 0;
		$res["dest_result"] = ($res["dest_id"] != 0) ? $this->balanceChanges[ $res["dest_id"] ] : 0;
		$res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	protected function postUpdate($item_id)
	{
		$this->cleanCache();

		$trObj = $this->getItem($item_id);
		if (!$trObj)
			return;

		// Commit balance changes for affected accounts
		$this->accModel->updateBalances($this->balanceChanges);
		unset($this->balanceChanges);

		// update position of transaction if target date is not today
		if ($trObj->pos === 0)
		{
			$latest_pos = $this->getLatestPos($trObj->date);
			$this->updatePos($item_id, $latest_pos + 1);
		}
		else
		{
			$this->updateResults($trObj->src_id, $trObj->dest_id, 0, $trObj->pos);
		}

		// Update results of accounts
		if ($this->originalTrans->src_id != $trObj->src_id ||
			$this->originalTrans->dest_id != $trObj->dest_id)
		{
			$this->updateResults($this->originalTrans->src_id, $this->originalTrans->dest_id, 0, $trObj->pos);
		}
		unset($this->updateOriginalTrans);
	}


	// Check is transaction with specified position exist
	public function isPosExist($trans_pos)
	{
		$tr_pos = intval($trans_pos);

		if (!$this->checkCache())
			return FALSE;

		foreach($this->cache as $tr_id => $item)
		{
			if ($item->pos == $tr_pos)
				return TRUE;
		}

		return FALSE;
	}


	// Update position of specified transaction and fix position of
	public function updatePos($trans_id, $new_pos)
	{
		$trans_id = intval($trans_id);
		$new_pos = intval($new_pos);
		if (!$trans_id || !$new_pos)
			return FALSE;

		$trObj = $this->getItem($trans_id);
		if (!$trObj)
			return FALSE;

		if ($trObj->user_id != self::$user_id)
			return FALSE;

		$old_pos = $trObj->pos;

		$condArr = [ "user_id=".self::$user_id ];

		$curDate = date("Y-m-d H:i:s");

		$assignArr = [];
		if ($old_pos == $new_pos)
		{
			return TRUE;
		}
		else if ($this->isPosExist($new_pos))
		{
			if ($old_pos == 0)			// insert with specified position
			{
				$latest = $this->getLatestPos();

				$condArr[] = "pos >= ".$new_pos;
				$condArr[] = "pos <= ".$latest;
				$assignArr[] = "pos=pos+1";
			}
			else if ($new_pos < $old_pos)		// moving up
			{
				$condArr[] = "pos >= ".$new_pos;
				$condArr[] = "pos < ".$old_pos;
				$assignArr[] = "pos=pos+1";
			}
			else if ($new_pos > $old_pos)		// moving down
			{
				$condArr[] = "pos > ".$old_pos;
				$condArr[] = "pos <= ".$new_pos;
				$assignArr[] = "pos=pos-1";
			}

			$assignArr["updatedate"] = $curDate;

			if (!$this->dbObj->updateQ($this->tbl_name, $assignArr, $condArr))
				return FALSE;
		}

		if (!$this->dbObj->updateQ($this->tbl_name, [ "pos" => $new_pos, "updatedate" => $curDate ], "id=".$trans_id))
			return FALSE;

		$updateFromPos = ($old_pos != 0) ? min($old_pos, $new_pos) : $new_pos;
		$this->updateResults($trObj->src_id, $trObj->dest_id, 0, $updateFromPos);

		$this->cleanCache();

		return TRUE;
	}


	// Return result balance of account before transaction with specifiec position
	public function getLatestResult($acc_id, $ignore_trans_id, $pos = -1)
	{
		$acc_id = intval($acc_id);
		if (!$acc_id)
			return NULL;

		$accCond = $this->getAccCondition($acc_id);
		if ($pos === -1)
			$pos = $this->getLatestPos() + 1;

		if ($pos < 2)
		{
			$resultBalanceAvailable = FALSE;
		}
		else
		{
			$condArr = [ "user_id=".self::$user_id, "pos < $pos", "pos<>0", $accCond ];
			$ignore_trans_id = intval($ignore_trans_id);
			if ($ignore_trans_id)
				$condArr[] = "id<>".$ignore_trans_id;

			$qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr, NULL, "pos DESC LIMIT 1");
			$resultBalanceAvailable = ($this->dbObj->rowsCount($qResult) == 1);
		}

		if ($resultBalanceAvailable)
		{
			$row = $this->dbObj->fetchRow($qResult);
			if ($acc_id == intval($row["src_id"]))
				$res = floatval($row["src_result"]);
			else
				$res = floatval($row["dest_result"]);
		}
		else
		{
			$accObj = $this->accModel->getItem($acc_id);
			$res = ($accObj) ? $accObj->initbalance : NULL;
		}

		return $res;
	}


	protected function pushUniq(&$storage, $key, $value)
	{
		if (!is_array($storage))
			throw new Error("Invalid storage specified");

		if (!isset($storage[$key]))
			$storage[$key] = [];

		if (!in_array($value, $storage[$key]))
			$storage[$key][] = $value;
	}


	// Search for specified array of values in storage
	// Values may be in different order
	// If found remove item from storage and return key
	// Return NULL if no value is found
	protected function findInStorage(&$storage, $expectedValues)
	{
		foreach($storage as $key => $values)
		{
			if (!array_diff($expectedValues, $values) &&
				!array_diff($values, $expectedValues))
			{
				unset($storage[$key]);
				return $key;
			}
		}

		return NULL;
	}


	protected function diffAssignment($field, $diff)
	{
		if (floatval($diff) > 0)
			return "$field=$field+$diff";
		else
			return "$field=$field$diff";
	}


	//
	protected function updateResults($src_id, $dest_id, $ignore_trans_id, $pos)
	{
		if (!$src_id && !$dest_id)
			return FALSE;

		// Get previous results
		$results = [];
		if ($src_id != 0)
			$results[$src_id] = $this->getLatestResult($src_id, $ignore_trans_id, $pos);
		if ($dest_id != 0)
			$results[$dest_id] = $this->getLatestResult($dest_id, $ignore_trans_id, $pos);

		// Request affected transactions
		$condArr = [ "user_id=".self::$user_id, "pos>=".$pos ];
		$accCond = $this->getAccCondition([ $src_id, $dest_id ]);
		if (!is_empty($accCond))
			$condArr[] = $accCond;

		$srcAssingments = [];
		$destAssingments = [];

		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr, NULL, "pos ASC");
		while($row = $this->dbObj->fetchRow($qResult))
		{
			$tr = $this->rowToObj($row);
			unset($row);

			if ($tr->type == EXPENSE || $tr->type == TRANSFER || $tr->type == DEBT)
			{
				if ($tr->src_id && isset($results[$tr->src_id]))
				{
					$results[$tr->src_id] = round($results[$tr->src_id] - $tr->src_amount, 2);
					$diff = round($results[$tr->src_id] - $tr->src_result, 2);
					if (abs($diff) >= 0.01)
						$this->pushUniq($srcAssingments, strval($diff), $tr->id);
				}
			}

			if ($tr->type == INCOME || $tr->type == TRANSFER || $tr->type == DEBT)
			{
				if ($tr->dest_id && isset($results[$tr->dest_id]))
				{
					$results[$tr->dest_id] = round($results[$tr->dest_id] + $tr->dest_amount, 2);
					$diff = round($results[$tr->dest_id] - $tr->dest_result, 2);
					if (abs($diff) >= 0.01)
						$this->pushUniq($destAssingments, strval($diff), $tr->id);
				}
			}
		}

		foreach($srcAssingments as $diff => $ids)
		{
			$assingments = [
				$this->diffAssignment("src_result", $diff)
			];

			$destDiff = $this->findInStorage($destAssingments, $ids);
			if (!is_null($destDiff))
				$assingments[] = $this->diffAssignment("dest_result", $destDiff);

			if (!$this->dbObj->updateQ($this->tbl_name, $assingments, "id".inSetCondition($ids)))
				return FALSE;
		}

		foreach($destAssingments as $diff => $ids)
		{
			$assingments = [
				$this->diffAssignment("dest_result", $diff)
			];

			if (!$this->dbObj->updateQ($this->tbl_name, $assingments, "id".inSetCondition($ids)))
				return FALSE;
		}

		$this->cleanCache();

		return TRUE;
	}


	// Preparations for item delete
	protected function preDelete($items)
	{
		$this->balanceChanges = [];
		$this->removedItems = [];
		foreach($items as $item_id)
		{
			// check transaction is exists
			$trObj = $this->getItem($item_id);
			if (!$trObj)
				return FALSE;

			// cancel transaction
			$this->balanceChanges = $this->cancelTransaction($trObj, $this->balanceChanges);

			$this->removedItems[] = $trObj;
		}

		return TRUE;
	}


	// Preparations for item delete
	protected function postDelete($items)
	{
		// Commit balance changes for affected accounts
		$this->accModel->updateBalances($this->balanceChanges);
		unset($this->balanceChanges);

		foreach($this->removedItems as $trObj)
		{
			$this->updateResults($trObj->src_id, $trObj->dest_id, $trObj->id, $trObj->pos + 1);
		}

		unset($this->removedItems);

		$this->cleanCache();
	}


	// Return latest position of user transactions
	public function getLatestPos($trans_date = -1)
	{
		if (!self::$user_id)
			return 0;

		$condArr = ["user_id=".self::$user_id];
		if ($trans_date != -1)
			$condArr[] = "date <= ".qnull(date("Y-m-d H:i:s", $trans_date));

		$qResult = $this->dbObj->selectQ("pos", $this->tbl_name, $condArr, NULL, "pos DESC LIMIT 1");
		if ($this->dbObj->rowsCount($qResult) != 1)
			return 0;

		$row = $this->dbObj->fetchRow($qResult);

		return intval($row["pos"]);
	}


	public function onAccountUpdate($acc_id)
	{
		$accObj = $this->accModel->getItem($acc_id);
		if (!$accObj)
			return FALSE;

		$new_curr = $accObj->curr_id;
		$curDate = date("Y-m-d H:i:s");
		$userCond = "user_id=".self::$user_id;

		// Update source transactions
		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "src_curr" => $new_curr, "updatedate" => $curDate ],
									[ $userCond, "src_id=".qnull($acc_id) ]))
			return FALSE;

		if (!$this->dbObj->updateQ($this->tbl_name,
									"src_amount=dest_amount",
									[ $userCond, "src_id=".qnull($acc_id), "dest_curr=".qnull($new_curr) ]))
			return FALSE;

		// Update destination transactions
		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "dest_curr" => $new_curr, "updatedate" => $curDate ],
									[ $userCond, "dest_id=".qnull($acc_id) ]))
			return FALSE;

		if (!$this->dbObj->updateQ($this->tbl_name,
									"dest_amount=src_amount",
									[ $userCond, "dest_id=".qnull($acc_id), "src_curr=".qnull($new_curr) ]))
			return FALSE;

		// Update results
		$this->updateResults($acc_id, $acc_id, 0, 0);

		$this->cleanCache();

		return TRUE;
	}


	// Remove specified account from transactions
	public function onAccountDelete($accounts)
	{
		if (!self::$user_id)
			return FALSE;

		$uMod = UserModel::getInstance();
		$uObj = $uMod->getItem(self::$user_id);
		if (!$uObj)
			throw new Error("User not found");

		$userCond = "user_id=".self::$user_id;

		if (!is_array($accounts))
			$accounts = [ $accounts ];

		$ids = [];
		$personAccounts = [];
		$userAccounts = [];
		foreach($accounts as $accObj)
		{
			$ids[] = $accObj->id;

			if ($accObj->owner_id == $uObj->owner_id)
				$userAccounts[] = $accObj->id;
			else
				$personAccounts[] = $accObj->id;
		}

		$setCond = inSetCondition($ids);
		if (is_null($setCond))
			return FALSE;


		// delete expenses and incomes
		// transactions where both accounts in set will be also deleted
		$condArr = [
			$userCond,
			orJoin([
				"src_id$setCond AND dest_id=0",
				"dest_id$setCond AND src_id=0",
				"src_id$setCond AND dest_id$setCond"
			])
		];

		$itemsToRemove = [];
		$idsToRemove = [];
		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr);
		while($row = $this->dbObj->fetchRow($qResult))
		{
			$item = $this->rowToObj($row);
			unset($row);

			$itemsToRemove[] = $item;
			$idsToRemove[] = $item->id;
		}

		if (count($idsToRemove) > 0)
		{
			if (!$this->dbObj->deleteQ($this->tbl_name, "id".inSetCondition($idsToRemove)))
				return FALSE;

			$this->cleanCache();
		}

		$curDate = date("Y-m-d H:i:s");

		if (count($personAccounts))		// specified account is account of person
		{
			$pSetCond = inSetCondition($personAccounts);
			if (is_null($pSetCond))
				return FALSE;

			// set outgoing debt(person take) as income to destination account
			$condArr = [ $userCond, "src_id".$pSetCond, "type=".DEBT ];
			if (!$this->dbObj->updateQ($this->tbl_name,
										[ "src_id" => 0, "type" => INCOME, "updatedate" => $curDate, "src_result" => 0 ],
										$condArr))
				return FALSE;

			// set incoming debt(person give) as expense from source account
			$condArr = [ $userCond, "dest_id".$pSetCond, "type=".DEBT ];
			if (!$this->dbObj->updateQ($this->tbl_name,
										[ "dest_id" => 0, "type" => EXPENSE, "updatedate" => $curDate, "dest_result" => 0 ],
										$condArr))
				return FALSE;
		}

		if (count($userAccounts))		// specified account is account of user
		{
			$uSetCond = inSetCondition($userAccounts);
			if (is_null($uSetCond))
				return FALSE;

			// set outgoing debt(person take) as debt without acc
			$condArr = [ $userCond, "src_id".$uSetCond, "type=".DEBT ];
			if (!$this->dbObj->updateQ($this->tbl_name,
										[ "src_id" => 0, "type" => DEBT, "updatedate" => $curDate, "src_result" => 0 ],
										$condArr))
				return FALSE;

			// set incoming debt(person give) as debt without acc
			$condArr = [ $userCond, "dest_id".$uSetCond, "type=".DEBT ];
			if (!$this->dbObj->updateQ($this->tbl_name,
										[ "dest_id" => 0, "type" => DEBT, "updatedate" => $curDate, "dest_result" => 0 ],
										$condArr))
				return FALSE;
		}

		// set transfer from account as income to destination account
		$condArr = [ $userCond, "src_id".$setCond, "type=".TRANSFER ];
		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "src_id" => 0, "type" => INCOME, "updatedate" => $curDate, "src_result" => 0 ],
									$condArr))
			return FALSE;

		// set transfer to account as expense from source account
		$condArr = [ $userCond, "dest_id".$setCond, "type=".TRANSFER ];
		if (!$this->dbObj->updateQ($this->tbl_name,
									[ "dest_id" => 0, "type" => EXPENSE, "updatedate" => $curDate, "dest_result" => 0 ],
									$condArr))
			return FALSE;

		// Update results of transactions with affected accounts
		foreach($ids as $acc_id)
		{
			$this->updateResults($acc_id, $acc_id, 0, 0);
		}

		return TRUE;
	}


	// Return condition string for list of accounts
	private function getAccCondition($accounts = NULL)
	{
		$setCond = inSetCondition($accounts);
		if (is_null($setCond))
			return "";

		return orJoin([ "src_id".$setCond, "dest_id".$setCond ]);
	}


	// Return array of transactions
	// Params:
	//   type - type of transaction filter. Default is ALL
	//   accounts - array of accounts to filter by. Default is empty
	//   search - query string to search by comments. Default is empty
	//   startDate - start date of transactions filter. Default is empty
	//   endDate - end date of transactions filter. Default is empty
	//   desc - sort result descending
	//   onPage - count of transactions per page.
	public function getData($params = NULL)
	{
		if (is_null($params))
			$params = [];

		$res = [];

		if (!self::$user_id)
			return $res;

		$uMod = UserModel::getInstance();
		$uObj = $uMod->getItem(self::$user_id);
		if (!$uObj)
			throw new Error("User not found");

		$owner_id = $uObj->owner_id;
		if (!$owner_id)
			return $res;

		if (!$this->accModel->getCount([ "full" => TRUE ]))
			return $res;

		// Skip if no transactions at all
		if (!$this->dbObj->countQ($this->tbl_name, "user_id=".self::$user_id))
			return $res;

		$condArr = [ "user_id=".self::$user_id ];

		// Transaction type condition
		$tr_type = isset($params["type"]) ? intval($params["type"]) : 0;
		if ($tr_type != 0)
			$condArr[] = "type=".$tr_type;

		// Accounts filter condition
		if (isset($params["accounts"]) && !is_null($params["accounts"]))
		{
			$accCond = $this->getAccCondition($params["accounts"]);
			if (!is_empty($accCond))
				$condArr[] = $accCond;
		}

		// Search condition
		if (isset($params["search"]))
		{
			$sReq = $this->dbObj->escape($params["search"]);
			if (!is_empty($sReq))
				$condArr[] = "comment LIKE '%".$sReq."%'";
		}

		// Date range condition
		if (isset($params["startDate"]) && !is_null($params["startDate"]) &&
			isset($params["endDate"]) && !is_null($params["endDate"]))
		{
			$stdate = strtotime($params["startDate"]);
			$enddate = strtotime($params["endDate"]);
			if ($stdate != -1 && $enddate != -1)
			{
				$fstdate = date("Y-m-d H:i:s", $stdate);
				$fenddate = date("Y-m-d H:i:s", $enddate);

				$condArr[] = "date >= ".qnull($fstdate);
				$condArr[] = "date <= ".qnull($fenddate);
			}
		}

		// Sort order condition
		$isDesc = (isset($params["desc"]) && $params["desc"] == TRUE);
		$orderAndLimit = "pos ".(($isDesc == TRUE) ? "DESC" : "ASC");

		// Pagination conditions
		$tr_on_page = isset($params["onPage"]) ? intval($params["onPage"]) : 0;
		if ($tr_on_page > 0)
		{
			$page_num = isset($params["page"]) ? intval($params["page"]) : 0;

			$transCount = $this->dbObj->countQ($this->tbl_name, $condArr);

			$limitOffset = ($tr_on_page * $page_num);
			$limitRows = min($transCount - $limitOffset, $tr_on_page);

			$orderAndLimit .= " LIMIT ".$limitOffset.", ".$limitRows;
		}

		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr, NULL, $orderAndLimit);
		$rowCount = $this->dbObj->rowsCount($qResult);
		if (!$rowCount)
			return $res;

		while($row = $this->dbObj->fetchRow($qResult))
		{
			$trans = $this->rowToObj($row);
			unset($row);

			if ($trans->type == DEBT)
			{
				$src_owner_id = $dest_owner_id = 0;
				if ($trans->src_id != 0)
				{
					$accObj = $this->accModel->getItem($trans->src_id);
					if ($accObj)
						$src_owner_id = $accObj->owner_id;
				}

				if ($trans->dest_id != 0)
				{
					$accObj = $this->accModel->getItem($trans->dest_id);
					if ($accObj)
						$dest_owner_id = $accObj->owner_id;
				}
			}

			$trans->fsrcAmount = "";
			if ($trans->type == EXPENSE || ($trans->type == DEBT && ($dest_owner_id == 0 || $src_owner_id == $owner_id)))			// expense
				$trans->fsrcAmount .= "- ";
			else if ($trans->type == INCOME || ($trans->type == DEBT && ($src_owner_id == 0 || $dest_owner_id == $owner_id)))			// income
				$trans->fsrcAmount .= "+ ";
			$trans->fsrcAmount .= $this->currMod->format($trans->src_amount, $trans->src_curr);

			if ($trans->src_curr != $trans->dest_curr)
			{
				$trans->fdestAmount = "";
				if ($trans->type == EXPENSE || ($trans->type == DEBT && $src_owner_id == $owner_id))			// expense
					$trans->fdestAmount .= "- ";
				else if ($trans->type == INCOME || ($trans->type == DEBT && $dest_owner_id == $owner_id))			// income
					$trans->fdestAmount .= "+ ";
				$trans->fdestAmount .= $this->currMod->format($trans->dest_amount, $trans->dest_curr);
			}
			else
				$trans->fdestAmount = $trans->fsrcAmount;

			$trans->debtType = ($trans->type == DEBT) ? (($dest_owner_id == 0 || $dest_owner_id == $owner_id) ? 1 : 2) : 0;

			$res[] = $trans;
		}

		return $res;
	}


	// Return total count of transactions for specified condition
	public function getTransCount($params = NULL)
	{
		if (!self::$user_id)
			return 0;

		$condArr = [ "user_id=".self::$user_id ];

		if (is_null($params))
			$params = [];

		$tr_type = isset($params["type"]) ?  intval($params["type"]) : 0;
		if ($tr_type != 0)
			$condArr[] = "type=".$tr_type;

		if (isset($params["accounts"]) && !is_null($params["accounts"]))
		{
			$accCond = $this->getAccCondition($params["accounts"]);
			if (!is_empty($accCond))
				$condArr[] = $accCond;
		}

		if (isset($params["search"]))
		{
			$sReq = $this->dbObj->escape($params["search"]);
			if (!is_empty($sReq))
				$condArr[] = "comment LIKE '%".$sReq."%'";
		}

		if (isset($params["startDate"]) && !is_null($params["startDate"]) &&
			isset($params["endDate"]) && !is_null($params["endDate"]))
		{
			$stdate = strtotime($params["startDate"]);
			$enddate = strtotime($params["endDate"]);
			if ($stdate != -1 && $enddate != -1)
			{
				$fstdate = date("Y-m-d H:i:s", $stdate);
				$fenddate = date("Y-m-d H:i:s", $enddate);

				$condArr[] = "date >= ".qnull($fstdate);
				$condArr[] = "date <= ".qnull($fenddate);
			}
		}

		return $this->dbObj->countQ($this->tbl_name, $condArr);
	}


	// Return link to page with specified params
	// Convert App filter to GET
	public function getPageLink($params = NULL)
	{
		if (is_null($params))
			$params = [];

		$linkParams = [];

		// Convert type to string
		if (isset($params["type"]))
			$linkParams["type"] = $this->getTypeString($params["type"]);
		// Page number
		if (isset($params["page"]))
		{
			$pNum = intval($params["page"]);
			if ($pNum > 1)
				$linkParams["page"] = $pNum;
		}
		// Convert accounts list filter
		if (is_array($params["accounts"]) && count($params["accounts"]) > 0)
			$linkParams["acc_id"] = implode(",", $params["accounts"]);
		// Set list view mode
		if (isset($params["details"]) && $params["details"] == TRUE)
			$linkParams["mode"] = "details";
		// Copy search string if not empty
		if (isset($params["search"]) && !is_empty($params["search"]))
			$linkParams["search"] = $params["search"];
		// Copy date range parameters if exists
		if (isset($params["startDate"]) && !is_empty($params["startDate"]) &&
			isset($params["endDate"]) && !is_empty($params["endDate"]))
		{
			$linkParams["stdate"] = $startDate;
			$linkParams["enddate"] = $endDate;
		}

		$linkStr = urlJoin(BASEURL."transactions/", $linkParams);

		return $linkStr;
	}


	// Build paginator for specified condition:
	// 		page_num - zero based index of current page
	// 		pages_count - total count of pages available
	// Return array of paginator items
	// 		paginator_item: [ "text" => string, optional "active" => bool ]
	public function getPaginatorArray($page_num, $pages_count)
	{
		$res = [];

		$breakLimit = 5;
		$groupLimit = 3;

		if ($pages_count > $breakLimit)
		{
			if ($page_num < $groupLimit)		// 1 2 3 4 5 ... 18
			{
				for($i = 0; $i < $breakLimit; $i++)
				{
					$res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
				}
				$res[] = ["text" => "..."];
				$res[] = ["text" => $pages_count, "active" => FALSE];
			}
			else if ($page_num >= $groupLimit && $page_num < $pages_count - $groupLimit)		// 1 ... 14 15 16 ... 18
			{
				$res[] = ["text" => 1, "active" => FALSE];
				$res[] = ["text" => "..."];
				for($i = $page_num - ($groupLimit - 2); $i <= $page_num + ($groupLimit - 2); $i++)
				{
					$res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
				}
				$res[] = ["text" => "..."];
				$res[] = ["text" => $pages_count, "active" => FALSE];
			}
			else if ($page_num >= $groupLimit && $page_num >= $pages_count - $groupLimit)		// 1 ... 14 15 16 17 18
			{
				$res[] = ["text" => 1, "active" => FALSE];
				$res[] = ["text" => "..."];
				for($i = $pages_count - ($breakLimit); $i < $pages_count; $i++)
				{
					$res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
				}
			}
		}
		else		// 1 2 3 4 5
		{
			for($i = 0; $i < $pages_count; $i++)
			{
				$res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
			}
		}

		return $res;
	}


	// Return string for specified transaction type
	public static function getStringType($trans_type)
	{
		$keys = array_keys(self::$typeStrArr, $trans_type);
		if (!count($keys))
			return 0;

		return $keys[0];
	}


	// Return string for specified transaction type
	public static function getTypeString($trans_type)
	{
		if (!isset(self::$typeStrArr[$trans_type]))
			return NULL;

		return self::$typeStrArr[$trans_type];
	}


	// Build array with properties of account
	public function getProperties($trans_id)
	{
		$item = $this->getItem($trans_id);
		if (!$item)
			return NULL;

		$res = ["id" => $trans_id,
					"src_id" => $item->src_id,
					"dest_id" => $item->dest_id,
					"type" => $item->type,
					"src_curr" => $item->src_curr,
					"dest_curr" => $item->dest_curr,
					"src_amount" => $item->src_amount,
					"dest_amount" => $item->dest_amount,
					"date" => date("Y-m-d H:i:s", $item->date),
					"comment" => $item->comment ];

		return $res;
	}
}
