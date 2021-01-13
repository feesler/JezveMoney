<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;

use function JezveMoney\Core\inSetCondition;
use function JezveMoney\Core\orJoin;
use function JezveMoney\Core\qnull;

class TransactionModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    private static $user_id = 0;
    private static $owner_id = 0;
    private static $typeNames = [EXPENSE => "Expense", INCOME => "Income", TRANSFER => "Transfer", DEBT => "Debt"];
    private static $availTypes = [EXPENSE, INCOME, TRANSFER, DEBT];
    private static $srcAvailTypes = [EXPENSE, TRANSFER, DEBT];
    private static $srcMandatoryTypes = [EXPENSE, TRANSFER];

    private static $destAvailTypes = [INCOME, TRANSFER, DEBT];
    private static $destMandatoryTypes = [INCOME, TRANSFER];

    protected $tbl_name = "transactions";
    protected $accModel = null;
    protected $currMod = null;
    protected $affectedTransactions = null;
    protected $balanceChanges = null;
    protected $latestPos = null;
    protected $removedItems = null;
    protected $originalTrans = null;


    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();

        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();

        $this->accModel = AccountModel::getInstance();
        $this->currMod = CurrencyModel::getInstance();
    }


    // Convert DB row to item object
    protected function rowToObj($row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new \stdClass();
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
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id, null, "pos ASC");
    }


    protected function checkParams($params, $isUpdate = false)
    {
        $avFields = [
            "type",
            "src_id",
            "dest_id",
            "src_amount",
            "dest_amount",
            "src_curr",
            "dest_curr",
            "date",
            "comment"
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$isUpdate && !checkFields($params, $avFields)) {
            return null;
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
            if (!in_array($res["type"], self::$availTypes)) {
                wlog("Invalid type specified");
                return null;
            }
        }

        $srcAcc = null;
        if (isset($params["src_id"])) {
            $res["src_id"] = intval($params["src_id"]);
            // Check set state of account according to type of transaction
            if (
                ($res["src_id"] && !in_array($res["type"], self::$srcAvailTypes)) ||
                (!$res["src_id"] && in_array($res["type"], self::$srcMandatoryTypes))
            ) {
                wlog("Invalid src_id specified");
                return null;
            }

            // Check owner of account
            if ($res["src_id"]) {
                $srcAcc = $this->accModel->getItem($res["src_id"]);
                if (!$srcAcc || $srcAcc->user_id != self::$user_id) {
                    wlog("Invalid src_id specified");
                    return null;
                }
            }
        }

        $destAcc = null;
        if (isset($params["dest_id"])) {
            $res["dest_id"] = intval($params["dest_id"]);
            // Check set state of account according to type of transaction
            if (
                ($res["dest_id"] && !in_array($res["type"], self::$destAvailTypes)) ||
                (!$res["dest_id"] && in_array($res["type"], self::$destMandatoryTypes))
            ) {
                wlog("Invalid dest_id specified");
                return null;
            }

            // Check owner of account
            if ($res["dest_id"]) {
                $destAcc = $this->accModel->getItem($res["dest_id"]);
                if (!$destAcc || $destAcc->user_id != self::$user_id) {
                    wlog("Invalid dest_id specified");
                    return null;
                }
            }
        }

        if (isset($params["src_amount"])) {
            $res["src_amount"] = floatval($params["src_amount"]);
            if ($res["src_amount"] == 0.0) {
                wlog("Invalid src_amount specified");
                return null;
            }
        }

        if (isset($params["dest_amount"])) {
            $res["dest_amount"] = floatval($params["dest_amount"]);
            if ($res["dest_amount"] == 0.0) {
                wlog("Invalid dest_amount specified");
                return null;
            }
        }

        if (isset($params["src_curr"])) {
            $res["src_curr"] = intval($params["src_curr"]);
            if (
                !$this->currMod->isExist($res["src_curr"]) ||
                ($srcAcc && $srcAcc->curr_id != $res["src_curr"])
            ) {
                wlog("Invalid src_curr specified");
                return null;
            }
        }

        if (isset($params["dest_curr"])) {
            $res["dest_curr"] = intval($params["dest_curr"]);
            if (
                !$this->currMod->isExist($res["dest_curr"]) ||
                ($destAcc && $destAcc->curr_id != $res["dest_curr"])
            ) {
                wlog("Invalid dest_curr specified");
                return null;
            }
        }

        if (isset($params["date"])) {
            $res["date"] = is_string($params["date"]) ? strtotime($params["date"]) : intval($params["date"]);
            if (!$res["date"]) {
                wlog("Invalid date specified");
                return null;
            }
        }

        if (isset($params["comment"])) {
            $res["comment"] = $this->dbObj->escape($params["comment"]);
        }

        return $res;
    }


    protected function commitAffected()
    {
        if (
            !isset($this->affectedTransactions) ||
            !is_array($this->affectedTransactions) ||
            !count($this->affectedTransactions)
        ) {
            return false;
        }

        $curDate = date("Y-m-d H:i:s");

        $this->sortAffected();

        foreach ($this->affectedTransactions as $item_id => $item) {
            $item = (array)$item;

            $res = $this->checkParams($item);
            if (is_null($res)) {
                return false;
            }

            $res["date"] = date("Y-m-d H:i:s", $item["date"]);

            if (is_string($item["createdate"])) {
                $res["createdate"] = $item["createdate"];
            } else {
                $res["createdate"] = date("Y-m-d H:i:s", $item["createdate"]);
            }

            $res["updatedate"] = $curDate;
            $res["src_result"] = floatval($item["src_result"]);
            $res["dest_result"] = floatval($item["dest_result"]);
            $res["pos"] = intval($item["pos"]);
            $res["user_id"] = self::$user_id;
            $res["id"] = $item["id"];

            $this->affectedTransactions[$item_id] = $res;
        }

        $updResult = $this->dbObj->updateMultipleQ($this->tbl_name, $this->affectedTransactions);
        wlog(" update result: " . $updResult);

        $this->affectedTransactions = null;

        $this->cleanCache();

        return $updResult;
    }


    protected function getAffected($item)
    {
        if (!$item || !$item->id) {
            return null;
        }

        if (
            is_null($this->affectedTransactions) ||
            !is_array($this->affectedTransactions) ||
            !isset($this->affectedTransactions[$item->id])
        ) {
            return $item;
        }

        return $this->affectedTransactions[$item->id];
    }


    protected function pushAffected($item)
    {
        if (!$item || !$item->id) {
            return false;
        }

        if (is_null($this->affectedTransactions)) {
            $this->affectedTransactions = [];
        }

        $this->affectedTransactions[$item->id] = $item;

        return true;
    }


    protected function sortAffected()
    {
        if (!is_array($this->cache)) {
            return;
        }

        uasort($this->cache, function ($a, $b) {
            $a = $this->getAffected($a);
            $b = $this->getAffected($b);

            return $a->pos - $b->pos;
        });
    }


    // Preparations for item create
    protected function preCreate($params, $isMultiple = false)
    {
        $res = $this->checkParams($params);
        if (is_null($res)) {
            return null;
        }

        if (is_null($this->balanceChanges)) {
            $this->balanceChanges = [];
        }

        $this->balanceChanges = $this->applyTransaction($res, $this->balanceChanges);

        $res["pos"] = 0;
        $res["date"] = date("Y-m-d H:i:s", $res["date"]);
        $res["src_result"] = ($res["src_id"] != 0) ? $this->balanceChanges[$res["src_id"]] : 0;
        $res["dest_result"] = ($res["dest_id"] != 0) ? $this->balanceChanges[$res["dest_id"]] : 0;
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }


    protected function postCreate($items)
    {
        $this->cleanCache();

        if (!is_array($items)) {
            $items = [$items];
        }

        // Commit balance changes for affected accounts
        $this->accModel->updateBalances($this->balanceChanges);
        $this->balanceChanges = null;
        $this->latestPos = null;

        foreach ($items as $item_id) {
            $trObj = $this->getItem($item_id);
            if (!$trObj) {
                return;
            }

            // Update position of transaction if target date is not today
            if ($trObj->pos === 0) {
                $latest_pos = $this->getLatestPos($trObj->date);
                $this->updatePos($item_id, $latest_pos + 1);
            }
        }

        $this->commitAffected();
    }


    protected function getAffectedAccount($account_id)
    {
        if (is_array($this->balanceChanges) && isset($this->balanceChanges[$account_id])) {
            return $this->balanceChanges[$account_id];
        } else {
            return $this->accModel->getItem($account_id);
        }
    }


    public function pushBalance($account_id, $accountsList = [])
    {
        $res = $accountsList;

        if (!$account_id) {
            return $res;
        }

        if (!isset($res[$account_id])) {
            $account = $this->getAffectedAccount($account_id);
            if ($account) {
                $res[$account_id] = $account->balance;
            } else {
                $res[$account_id] = 0;
            }
        }

        return $res;
    }


    // Apply specified transaction to the list of accounts and return new state
    // If accounts list not specified returns only impact of transaction
    public function applyTransaction($trans, $accountsList = [])
    {
        if (!$trans) {
            throw new \Error("Invalid Transaction object");
        }

        $trans = (object)$trans;
        $res = $accountsList;

        if ($trans->src_id != 0) {
            $res = $this->pushBalance($trans->src_id, $res);
            $res[$trans->src_id] = round($res[$trans->src_id] - $trans->src_amount, 2);
        }

        if ($trans->dest_id != 0) {
            $res = $this->pushBalance($trans->dest_id, $res);
            $res[$trans->dest_id] = round($res[$trans->dest_id] + $trans->dest_amount, 2);
        }

        return $res;
    }


    // Cancel changes by specified transaction on list of accounts and return new state
    // If accounts list not specified returns only cancel of transaction impact
    public function cancelTransaction($trans, $accountsList = [])
    {
        if (!$trans) {
            throw new \Error("Invalid Transaction object");
        }

        $trans = (object)$trans;
        $res = $accountsList;

        if ($trans->src_id != 0) {
            $res = $this->pushBalance($trans->src_id, $res);
            $res[$trans->src_id] = round($res[$trans->src_id] + $trans->src_amount, 2);
        }

        if ($trans->dest_id != 0) {
            $res = $this->pushBalance($trans->dest_id, $res);
            $res[$trans->dest_id] = round($res[$trans->dest_id] - $trans->dest_amount, 2);
        }

        return $res;
    }


    // Preparations for item update
    protected function preUpdate($item_id, $params)
    {
        // check transaction is exist
        $trObj = $this->getItem($item_id);
        if (!$trObj) {
            return false;
        }

        // check user of transaction
        if ($trObj->user_id != self::$user_id) {
            return false;
        }

        $res = $this->checkParams($params, true);
        if (is_null($res)) {
            return null;
        }

        $this->originalTrans = $trObj;

        $canceled = $this->cancelTransaction($trObj);
        $this->balanceChanges = $this->applyTransaction($res, $canceled);

        // check date is changed
        $orig_date = getdate($trObj->date);
        $target_date = getdate($res["date"]);

        $orig_time = mktime(0, 0, 0, $orig_date["mon"], $orig_date["mday"], $orig_date["year"]);
        $target_time = mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]);

        if ($orig_time != $target_time) {
            $res["pos"] = 0;
        } else {
            $res["pos"] = $trObj->pos;
        }

        if (isset($res["date"])) {
            $res["date"] = date("Y-m-d H:i:s", $res["date"]);
        }
        $res["src_result"] = ($res["src_id"] != 0) ? $this->balanceChanges[$res["src_id"]] : 0;
        $res["dest_result"] = ($res["dest_id"] != 0) ? $this->balanceChanges[$res["dest_id"]] : 0;
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    protected function postUpdate($item_id)
    {
        $this->cleanCache();

        $trObj = $this->getItem($item_id);
        if (!$trObj) {
            return;
        }

        // Commit balance changes for affected accounts
        $this->accModel->updateBalances($this->balanceChanges);
        $this->balanceChanges = null;

        // update position of transaction if target date was changed
        if ($trObj->pos === 0) {
            $latest_pos = $this->getLatestPos($trObj->date);
            $this->updatePos($item_id, $latest_pos + 1);
        } else {
            $this->updateResults([$trObj->src_id, $trObj->dest_id], $trObj->pos);
        }

        // Update results of accounts
        if (
            ($this->originalTrans->src_id != $trObj->src_id) ||
            ($this->originalTrans->dest_id != $trObj->dest_id)
        ) {
            $this->updateResults([$this->originalTrans->src_id, $this->originalTrans->dest_id], $trObj->pos);
        }
        $this->originalTrans = null;

        $this->commitAffected();
    }


    // Check is transaction with specified position exist
    public function isPosExist($trans_pos)
    {
        $tr_pos = intval($trans_pos);

        if (!$this->checkCache()) {
            return false;
        }

        foreach ($this->cache as $tr_id => $item) {
            $trans = $this->getAffected($item);

            if ($trans->pos == $tr_pos) {
                return true;
            }
        }

        return false;
    }


    protected function getRange($fromPos, $includeFrom, $toPos, $includeTo)
    {
        if (!$this->checkCache()) {
            return false;
        }

        $res = [];
        foreach ($this->cache as $tr_id => $item) {
            $trans = $this->getAffected($item);

            if (
                ($includeFrom && ($trans->pos < $fromPos)) ||
                (!$includeFrom && ($trans->pos <= $fromPos))
            ) {
                continue;
            }

            if (
                ($includeTo && ($trans->pos > $toPos)) ||
                (!$includeTo && ($trans->pos >= $toPos))
            ) {
                continue;
            }

            $res[$tr_id] = $trans;
        }

        return $res;
    }


    // Update position of specified transaction and fix position of
    protected function updatePos($trans_id, $new_pos)
    {
        $trans_id = intval($trans_id);
        $new_pos = intval($new_pos);
        if (!$trans_id || !$new_pos) {
            return false;
        }

        $trObj = $this->getItem($trans_id);
        if (!$trObj) {
            return false;
        }

        if ($trObj->user_id != self::$user_id) {
            return false;
        }

        $old_pos = $trObj->pos;
        if ($old_pos == $new_pos) {
            return true;
        } elseif ($this->isPosExist($new_pos)) {
            if ($old_pos == 0) {           // insert with specified position
                $latest = $this->getLatestPos();

                $affectedRange = $this->getRange($new_pos, true, $latest, true);
                foreach ($affectedRange as $tr_id => $item) {
                    $queryItem = clone $item;
                    $queryItem->pos++;
                    $this->pushAffected($queryItem);
                }
            } elseif ($new_pos < $old_pos) {       // moving up
                $affectedRange = $this->getRange($new_pos, true, $old_pos, false);
                foreach ($affectedRange as $tr_id => $item) {
                    $queryItem = clone $item;
                    $queryItem->pos++;
                    $this->pushAffected($queryItem);
                }
            } elseif ($new_pos > $old_pos) {        // moving down
                $affectedRange = $this->getRange($old_pos, false, $new_pos, true);
                foreach ($affectedRange as $tr_id => $item) {
                    $queryItem = clone $item;
                    $queryItem->pos--;
                    $this->pushAffected($queryItem);
                }
            }
        }

        $queryItem = clone $trObj;
        $queryItem->pos = $new_pos;
        $this->pushAffected($queryItem);
        $this->sortAffected();

        if (!$old_pos && isset($this->originalTrans)) {
            $old_pos = $this->originalTrans->pos;
        }

        $updateFromPos = ($old_pos != 0) ? min($old_pos, $new_pos) : $new_pos;
        $this->updateResults([$trObj->src_id, $trObj->dest_id], $updateFromPos);

        return true;
    }


    // For external use: update position and commit affected
    public function updatePosition($trans_id, $new_pos)
    {
        $res = $this->updatePos($trans_id, $new_pos);
        if ($res) {
            $this->commitAffected();
        }

        return $res;
    }


    // Return result balance of account before transaction with specified position
    public function getLatestResult($acc_id, $pos = false)
    {
        $acc_id = intval($acc_id);
        if (!$acc_id) {
            return null;
        }
        if ($pos === false) {
            $pos = $this->getLatestPos() + 1;
        }

        $res = null;
        if ($pos > 1) {
            $posOfRes = 0;
            foreach ($this->cache as $tr_id => $item) {
                $trans = $this->getAffected($item);

                if ($trans->src_id != $acc_id && $trans->dest_id != $acc_id) {
                    continue;
                }
                if (!$trans->pos || $trans->pos >= $pos || $trans->pos <= $posOfRes) {
                    continue;
                }

                $res = ($trans->src_id == $acc_id) ? $trans->src_result : $trans->dest_result;
                $posOfRes = $trans->pos;
            }
        }

        if (is_null($res)) {
            $accObj = $this->accModel->getItem($acc_id);
            $res = ($accObj) ? $accObj->initbalance : null;
        }

        return $res;
    }


    // Update result balance values of specified transactions
    //    accounts - id or arrays of account ids to filter transactions by
    //    pos - position of transaction to start update from, inclusively
    protected function updateResults($accounts, $pos)
    {
        $accounts = skipZeros($accounts);

        // Get previous results
        $results = [];
        foreach ($accounts as $account_id) {
            if (!$account_id) {
                continue;
            }

            $results[$account_id] = $this->getLatestResult($account_id, $pos);
        }

        // Request affected transactions
        if (!$this->checkCache()) {
            return null;
        }

        foreach ($this->cache as $item_id => $item) {
            $tr = $this->getAffected($item);

            if (!in_array($tr->src_id, $accounts) && !in_array($tr->dest_id, $accounts)) {
                continue;
            }
            if ($tr->pos < $pos) {
                continue;
            }

            $queryItem = null;
            $results = $this->applyTransaction($tr, $results);

            if (
                in_array($tr->type, self::$srcAvailTypes) &&
                $tr->src_id &&
                in_array($tr->src_id, $accounts)
            ) {
                if (is_null($queryItem)) {
                    $queryItem = clone $tr;
                }

                $queryItem->src_result = $results[$tr->src_id];
            }

            if (
                in_array($tr->type, self::$destAvailTypes) &&
                $tr->dest_id &&
                in_array($tr->dest_id, $accounts)
            ) {
                if (is_null($queryItem)) {
                    $queryItem = clone $tr;
                }

                $queryItem->dest_result = $results[$tr->dest_id];
            }

            if (!is_null($queryItem)) {
                $this->pushAffected($queryItem);
            }
        }

        return true;
    }


    // Preparations for item delete
    protected function preDelete($items)
    {
        $this->balanceChanges = [];
        $this->removedItems = [];
        foreach ($items as $item_id) {
            // check transaction is exists
            $trObj = $this->getItem($item_id);
            if (!$trObj) {
                return false;
            }

            // cancel transaction
            $this->balanceChanges = $this->cancelTransaction($trObj, $this->balanceChanges);

            $this->removedItems[] = clone $trObj;

            unset($this->cache[$trObj->id]);
        }

        return true;
    }


    // Preparations for item delete
    protected function postDelete($items)
    {
        // Commit balance changes for affected accounts
        $this->accModel->updateBalances($this->balanceChanges);
        $this->balanceChanges = null;

        foreach ($this->removedItems as $trObj) {
            $this->updateResults([$trObj->src_id, $trObj->dest_id], $trObj->pos + 1);
        }
        $this->removedItems = null;

        $this->commitAffected();

        $this->cleanCache();
    }


    // Return latest position of user transactions
    public function getLatestPos($trans_date = false)
    {
        if (!$this->checkCache()) {
            return 0;
        }

        $res = 0;
        foreach ($this->cache as $tr_id => $item) {
            $trans = $this->getAffected($item);

            if ($trans_date !== false && $trans->date > $trans_date) {
                continue;
            }

            $res = max($trans->pos, $res);
        }

        return $res;
    }


    public function onAccountUpdate($acc_id)
    {
        $accObj = $this->accModel->getItem($acc_id);
        if (!$accObj) {
            return false;
        }

        $new_curr = $accObj->curr_id;
        if (!$this->checkCache()) {
            return 0;
        }

        foreach ($this->cache as $item_id => $item) {
            $trans = $this->getAffected($item);

            if ($trans->src_id != $acc_id && $trans->dest_id != $acc_id) {
                continue;
            }

            if ($trans->src_id == $acc_id) {
                $trans->src_curr = $new_curr;
                if ($trans->dest_curr == $new_curr) {
                    $trans->src_amount = $trans->dest_amount;
                }
            }

            if ($trans->dest_id == $acc_id) {
                $trans->dest_curr = $new_curr;
                if ($trans->src_curr == $new_curr) {
                    $trans->dest_amount = $trans->src_amount;
                }
            }

            $this->pushAffected($trans);
        }

        $this->updateResults($acc_id, 0);

        $this->commitAffected();

        return true;
    }


    // Remove specified account from transactions
    public function onAccountDelete($accounts)
    {
        if (!self::$user_id || is_null($accounts)) {
            return false;
        }

        $uMod = UserModel::getInstance();
        $uObj = $uMod->getItem(self::$user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $accounts = asArray($accounts);
        $ids = [];
        $personAccounts = [];
        $userAccounts = [];
        foreach ($accounts as $accObj) {
            $ids[] = $accObj->id;

            if ($accObj->owner_id == $uObj->owner_id) {
                $userAccounts[] = $accObj->id;
            } else {
                $personAccounts[] = $accObj->id;
            }
        }

        if (!$this->checkCache()) {
            return 0;
        }

        $curDate = date("Y-m-d H:i:s");

        $idsToRemove = [];
        foreach ($this->cache as $item_id => $item) {
            $trans = $this->getAffected($item);

            $srcMatch = in_array($trans->src_id, $ids);
            $destMatch = in_array($trans->dest_id, $ids);
            if (!$srcMatch && !$destMatch) {
                continue;
            }

            if (
                ($srcMatch && $destMatch) ||
                ($srcMatch && $trans->dest_id == 0) ||
                ($destMatch && $trans->src_id == 0)
            ) {
                $idsToRemove[] = $item_id;
                unset($this->cache[$item_id]);
                continue;
            }

            $queryItem = null;

            // check account of person

            // set outgoing debt(person take) as income to destination account
            if ($trans->type == DEBT && in_array($trans->src_id, $personAccounts)) {
                $queryItem = clone $trans;
                $queryItem->type = INCOME;
                $queryItem->src_id = 0;
                $queryItem->src_result = 0;
            }

            // set incoming debt(person give) as expense from source account
            if ($trans->type == DEBT && in_array($trans->dest_id, $personAccounts)) {
                $queryItem = clone $trans;
                $queryItem->type = EXPENSE;
                $queryItem->dest_id = 0;
                $queryItem->dest_result = 0;
            }

            // check account of user

            // set outgoing debt(person take) as debt without acc
            if ($trans->type == DEBT && in_array($trans->src_id, $userAccounts)) {
                $queryItem = clone $trans;
                $queryItem->src_id = 0;
                $queryItem->src_result = 0;
            }

            // set incoming debt(person give) as debt without acc
            if ($trans->type == DEBT && in_array($trans->dest_id, $userAccounts)) {
                $queryItem = clone $trans;
                $queryItem->dest_id = 0;
                $queryItem->dest_result = 0;
            }

            // set transfer from account as income to destination account
            if ($trans->type == TRANSFER && $srcMatch) {
                $queryItem = clone $trans;
                $queryItem->type = INCOME;
                $queryItem->src_id = 0;
                $queryItem->src_result = 0;
            }

            // set transfer to account as expense from source account
            if ($trans->type == TRANSFER && $destMatch) {
                $queryItem = clone $trans;
                $queryItem->type = EXPENSE;
                $queryItem->dest_id = 0;
                $queryItem->dest_result = 0;
            }

            if (!is_null($queryItem)) {
                $this->pushAffected($queryItem);
            }
        }

        // Update results of transactions with affected accounts
        $this->updateResults($ids, 0);

        if (count($idsToRemove) > 0) {
            if (!$this->dbObj->deleteQ($this->tbl_name, "id" . inSetCondition($idsToRemove))) {
                return false;
            }

            $this->cleanCache();
        }

        $this->commitAffected();

        return true;
    }


    // Return condition string for list of accounts
    private function getAccCondition($accounts = null)
    {
        $setCond = inSetCondition($accounts);
        if (is_null($setCond)) {
            return null;
        }

        return orJoin(["src_id" . $setCond, "dest_id" . $setCond]);
    }


    // Return condition string for list of types
    private function getTypeCondition($types = null)
    {
        $setCond = inSetCondition($types);
        if (is_null($setCond)) {
            return null;
        }

        return "type" . $setCond;
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
    public function getData($params = null)
    {
        if (is_null($params)) {
            $params = [];
        }

        $res = [];

        if (!self::$user_id) {
            return $res;
        }

        $uMod = UserModel::getInstance();
        $uObj = $uMod->getItem(self::$user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $owner_id = $uObj->owner_id;
        if (!$owner_id) {
            return $res;
        }

        if (!$this->accModel->getCount(["full" => true])) {
            return $res;
        }

        // Skip if no transactions at all
        if (!$this->dbObj->countQ($this->tbl_name, "user_id=" . self::$user_id)) {
            return $res;
        }

        $condArr = ["user_id=" . self::$user_id];

        // Transaction type condition
        if (isset($params["type"])) {
            $typeCond = $this->getTypeCondition($params["type"]);
            if (!is_empty($typeCond)) {
                $condArr[] = $typeCond;
            }
        }

        // Accounts filter condition
        if (isset($params["accounts"])) {
            $accCond = $this->getAccCondition($params["accounts"]);
            if (!is_empty($accCond)) {
                $condArr[] = $accCond;
            }
        }

        // Search condition
        if (isset($params["search"])) {
            $sReq = $this->dbObj->escape($params["search"]);
            if (!is_empty($sReq)) {
                $condArr[] = "comment LIKE '%" . $sReq . "%'";
            }
        }

        // Date range condition
        if (
            isset($params["startDate"]) && !is_null($params["startDate"]) &&
            isset($params["endDate"]) && !is_null($params["endDate"])
        ) {
            $stdate = strtotime($params["startDate"]);
            $enddate = strtotime($params["endDate"]);
            if ($stdate != -1 && $enddate != -1) {
                $fstdate = date("Y-m-d H:i:s", $stdate);
                $fenddate = date("Y-m-d H:i:s", $enddate);

                $condArr[] = "date >= " . qnull($fstdate);
                $condArr[] = "date <= " . qnull($fenddate);
            }
        }

        // Sort order condition
        $isDesc = (isset($params["desc"]) && $params["desc"] == true);
        $orderAndLimit = "pos " . (($isDesc == true) ? "DESC" : "ASC");

        // Pagination conditions
        $tr_on_page = isset($params["onPage"]) ? intval($params["onPage"]) : 0;
        if ($tr_on_page > 0) {
            $page_num = isset($params["page"]) ? intval($params["page"]) : 0;

            $transCount = $this->dbObj->countQ($this->tbl_name, $condArr);

            $limitOffset = ($tr_on_page * $page_num);
            $limitRows = min($transCount - $limitOffset, $tr_on_page);

            $orderAndLimit .= " LIMIT " . $limitOffset . ", " . $limitRows;
        }

        $qResult = $this->dbObj->selectQ("*", $this->tbl_name, $condArr, null, $orderAndLimit);
        $rowCount = $this->dbObj->rowsCount($qResult);
        if (!$rowCount) {
            return $res;
        }

        while ($row = $this->dbObj->fetchRow($qResult)) {
            $trans = $this->rowToObj($row);
            unset($row);

            $res[] = $trans;
        }

        return $res;
    }


    // Return total count of transactions for specified condition
    public function getTransCount($params = null)
    {
        if (!self::$user_id) {
            return 0;
        }

        $condArr = ["user_id=" . self::$user_id];

        if (is_null($params)) {
            $params = [];
        }

        // Transaction type condition
        if (isset($params["type"])) {
            $typeCond = $this->getTypeCondition($params["type"]);
            if (!is_empty($typeCond)) {
                $condArr[] = $typeCond;
            }
        }

        if (isset($params["accounts"]) && !is_null($params["accounts"])) {
            $accCond = $this->getAccCondition($params["accounts"]);
            if (!is_empty($accCond)) {
                $condArr[] = $accCond;
            }
        }

        if (isset($params["search"])) {
            $sReq = $this->dbObj->escape($params["search"]);
            if (!is_empty($sReq)) {
                $condArr[] = "comment LIKE '%" . $sReq . "%'";
            }
        }

        if (
            isset($params["startDate"]) && !is_null($params["startDate"]) &&
            isset($params["endDate"]) && !is_null($params["endDate"])
        ) {
            $stdate = strtotime($params["startDate"]);
            $enddate = strtotime($params["endDate"]);
            if ($stdate != -1 && $enddate != -1) {
                $fstdate = date("Y-m-d H:i:s", $stdate);
                $fenddate = date("Y-m-d H:i:s", $enddate);

                $condArr[] = "date >= " . qnull($fstdate);
                $condArr[] = "date <= " . qnull($fenddate);
            }
        }

        return $this->dbObj->countQ($this->tbl_name, $condArr);
    }


    // Return series array of amounts and date of transactions for statistics histogram
    public function getHistogramSeries($byCurrency, $curr_acc_id, $trans_type, $group_type = 0, $limit = 0)
    {
        $curr_acc_id = intval($curr_acc_id);
        $trans_type = intval($trans_type);
        if (!self::$user_id || !$curr_acc_id || !$trans_type) {
            return null;
        }

        $amountArr = [];
        $groupArr = [];
        $sumDate = null;
        $curDate = null;
        $prevDate = null;
        $curSum = 0.0;
        $itemsInGroup = 0;
        $trans_time = 0;

        if (!$this->checkCache()) {
            return null;
        }

        foreach ($this->cache as $item) {
            if ($item->type != $trans_type) {
                continue;
            }

            if ($byCurrency) {
                if ($trans_type == EXPENSE) {
                    if ($item->src_curr != $curr_acc_id) {
                        continue;
                    }
                } else {
                    if ($item->dest_curr != $curr_acc_id) {
                        continue;
                    }
                }
            } else {
                if ($trans_type == EXPENSE) {
                    if ($item->src_id != $curr_acc_id) {
                        continue;
                    }
                } else {
                    if ($item->dest_id != $curr_acc_id) {
                        continue;
                    }
                }
            }

            $trans_time = $item->date;
            $dateInfo = getdate($trans_time);
            $itemsInGroup++;

            if ($group_type == 0) {        // no grouping
                if ($trans_type == EXPENSE) {
                    $amountArr[] = $item->src_amount;
                } else {
                    $amountArr[] = $item->dest_amount;
                }

                if ($prevDate == null || $prevDate != $dateInfo["mday"]) {
                    $groupArr[] = [date("d.m.Y", $trans_time), $itemsInGroup];
                    $itemsInGroup = 0;
                }
                $prevDate = $dateInfo["mday"];
            } elseif ($group_type == 1) {    // group by day
                $curDate = $dateInfo["mday"];
            } elseif ($group_type == 2) {    // group by week
                $curDate = intval(date("W", $trans_time));
            } elseif ($group_type == 3) {    // group by month
                $curDate = $dateInfo["mon"];
            } elseif ($group_type == 4) {    // group by year
                $curDate = $dateInfo["year"];
            }

            if ($sumDate == null) {        // first iteration
                $sumDate = $curDate;
            } elseif ($sumDate != null && $sumDate != $curDate) {
                $sumDate = $curDate;
                $amountArr[] = $curSum;
                $curSum = 0.0;
                $groupArr[] = [date("d.m.Y", $trans_time), 1];
            }

            if ($trans_type == EXPENSE) {
                $curSum += $item->src_amount;
            } else {
                $curSum += $item->dest_amount;
            }
        }

        // save remain value
        if ($group_type != 0 && $curSum != 0.0) {
            if ($sumDate != null && $sumDate != $curDate) {
                $amountArr[] = $curSum;
                $groupArr[] = [date("d.m.Y", $trans_time), 1];
            } else {
                if (!count($amountArr)) {
                    $amountArr[] = $curSum;
                } else {
                    $amountArr[count($amountArr) - 1] += $curSum;
                }

                if (!count($groupArr)) {
                    $groupArr[] = [date("d.m.Y", $trans_time), 1];
                } elseif ($group_type == 0) {
                    $groupArr[count($groupArr) - 1][1]++;
                }
            }
        }

        if ($limit > 0) {
            $amountCount = count($amountArr);
            $limitCount = min($amountCount, $limit);
            $amountArr = array_slice($amountArr, -$limitCount);

            $groupCount = count($groupArr);

            $newGroupsCount = 0;
            $groupLimit = 0;
            $i = $groupCount - 1;
            while ($i >= 0 && $groupLimit < $limitCount) {
                $groupLimit += $groupArr[$i][1];

                $newGroupsCount++;
                $i--;
            }

            $groupArr = array_slice($groupArr, -$newGroupsCount);
        }

        $res = new \stdClass();
        $res->values = $amountArr;
        $res->series = $groupArr;

        return $res;
    }


    /**
     * Build paginator for specified condition:
     *
     * @param int $page_num: zero based index of current page ;
     * @param int $pages_count: total count of pages available ;
     *
     * @return array of paginator items:
     *     - text (string) - title of paginator item ;
     *     - active (boolean) - optional active flag ;
     */
    public function getPaginatorArray(int $page_num, int $pages_count)
    {
        $res = [];

        $breakLimit = 5;
        $groupLimit = 3;

        if ($pages_count > $breakLimit) {
            /*  1 2 3 4 5 ... 18  */
            if ($page_num < $groupLimit) {
                for ($i = 0; $i < $breakLimit; $i++) {
                    $res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
                }
                $res[] = ["text" => "..."];
                $res[] = ["text" => $pages_count, "active" => false];
                /*  1 ... 14 15 16 ... 18  */
            } elseif ($page_num >= $groupLimit && $page_num < $pages_count - $groupLimit) {
                $res[] = ["text" => 1, "active" => false];
                $res[] = ["text" => "..."];
                for ($i = $page_num - ($groupLimit - 2); $i <= $page_num + ($groupLimit - 2); $i++) {
                    $res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
                }
                $res[] = ["text" => "..."];
                $res[] = ["text" => $pages_count, "active" => false];
                /*  1 ... 14 15 16 17 18  */
            } elseif ($page_num >= $groupLimit && $page_num >= $pages_count - $groupLimit) {
                $res[] = ["text" => 1, "active" => false];
                $res[] = ["text" => "..."];
                for ($i = $pages_count - $breakLimit; $i < $pages_count; $i++) {
                    $res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
                }
            }
        } else {
            /*  1 2 3 4 5  */
            for ($i = 0; $i < $pages_count; $i++) {
                $res[] = ["text" => ($i + 1), "active" => ($i == $page_num)];
            }
        }

        return $res;
    }


    // Convert transaction object to list item
    public function getListItem($transaction, $detailsMode = false)
    {
        if (!$transaction || !$transaction->id) {
            throw new \Error("Invalid transaction specified");
        }

        $res = ["id" => $transaction->id];

        // Build accounts string
        $accStr = "";
        if ($transaction->src_id != 0 && in_array($transaction->type, self::$srcAvailTypes)) {
            $accStr .= $this->accModel->getNameOrPerson($transaction->src_id);
        }

        if (
            $transaction->src_id != 0 && $transaction->dest_id != 0 &&
            in_array($transaction->type, [TRANSFER, DEBT])
        ) {
            $accStr .= " → ";
        }

        if ($transaction->dest_id != 0 && in_array($transaction->type, self::$destAvailTypes)) {
            $accStr .= $this->accModel->getNameOrPerson($transaction->dest_id);
        }

        $res["acc"] = $accStr;

        // Build amount string
        $src_owner_id = 0;
        $dest_owner_id = 0;
        if ($transaction->type == DEBT) {
            if ($transaction->src_id != 0) {
                $accObj = $this->accModel->getItem($transaction->src_id);
                if ($accObj) {
                    $src_owner_id = $accObj->owner_id;
                }
            }

            if ($transaction->dest_id != 0) {
                $accObj = $this->accModel->getItem($transaction->dest_id);
                if ($accObj) {
                    $dest_owner_id = $accObj->owner_id;
                }
            }

            $debtType = ($dest_owner_id == 0 || $dest_owner_id == self::$owner_id) ? 1 : 2;
        }

        $fmtSrcAmount = "";
        if (
            $transaction->type == EXPENSE ||
            ($transaction->type == DEBT && ($dest_owner_id == 0 || $src_owner_id == self::$owner_id))
        ) {
            $fmtSrcAmount .= "- ";
        } elseif (
            $transaction->type == INCOME ||
            ($transaction->type == DEBT && ($src_owner_id == 0 || $dest_owner_id == self::$owner_id))
        ) {
            $fmtSrcAmount .= "+ ";
        }
        $fmtSrcAmount .= $this->currMod->format($transaction->src_amount, $transaction->src_curr);

        if ($transaction->src_curr != $transaction->dest_curr) {
            $fmtDestAmount = "";
            if (
                $transaction->type == EXPENSE ||
                ($transaction->type == DEBT && $src_owner_id == self::$owner_id)
            ) {
                $fmtDestAmount .= "- ";
            } elseif (
                $transaction->type == INCOME ||
                ($transaction->type == DEBT && $dest_owner_id == self::$owner_id)
            ) {
                $fmtDestAmount .= "+ ";
            }
            $fmtDestAmount .= $this->currMod->format($transaction->dest_amount, $transaction->dest_curr);
        } else {
            $fmtDestAmount = $fmtSrcAmount;
        }

        $amStr = $fmtSrcAmount;
        if ($fmtSrcAmount != $fmtDestAmount) {
            $amStr .= " ($fmtDestAmount)";
        }
        $res["amount"] = $amStr;

        $res["date"] =  date("d.m.Y", $transaction->date);
        $res["comment"] = $transaction->comment;

        if ($detailsMode) {
            $res["balance"] = [];

            if ($transaction->src_id != 0) {
                $res["balance"][] = $this->currMod->format($transaction->src_result, $transaction->src_curr);
            }

            if ($transaction->dest_id != 0) {
                $res["balance"][] = $this->currMod->format($transaction->dest_result, $transaction->dest_curr);
            }
        }

        return $res;
    }


    // Return string for specified transaction type
    public static function stringToType($trans_type)
    {
        $reqType = strtolower($trans_type);
        foreach (self::$typeNames as $type_id => $typeName) {
            if (strtolower($typeName) == $reqType) {
                return $type_id;
            }
        }

        return 0;
    }


    // Return string for specified transaction type
    public static function typeToString($trans_type)
    {
        if (!isset(self::$typeNames[$trans_type])) {
            return null;
        }

        return self::$typeNames[$trans_type];
    }


    // Return array of names of available types of transactions
    // [ type => 'name string', ... ]
    public static function getTypeNames()
    {
        return self::$typeNames;
    }
}
