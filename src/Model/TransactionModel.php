<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;

use function JezveMoney\Core\inSetCondition;
use function JezveMoney\Core\orJoin;
use function JezveMoney\Core\qnull;

const NO_GROUP = 0;
const GROUP_BY_DAY = 1;
const GROUP_BY_WEEK = 2;
const GROUP_BY_MONTH = 3;
const GROUP_BY_YEAR = 4;


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

    private static $histogramGroupNames = [
        NO_GROUP => "None",
        GROUP_BY_DAY => "Day",
        GROUP_BY_WEEK => "Week",
        GROUP_BY_MONTH => "Month",
        GROUP_BY_YEAR => "Year"
    ];

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


    protected function validateParams($params, $item_id = false)
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
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
            if (!in_array($res["type"], self::$availTypes)) {
                throw new \Error("Invalid type specified");
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
                throw new \Error("Invalid src_id specified");
            }

            // Check user and owner of account
            if ($res["src_id"]) {
                $srcAcc = $this->accModel->getItem($res["src_id"]);
                if (
                    !$srcAcc
                    || $srcAcc->user_id != self::$user_id
                    || ($res["type"] != DEBT && $srcAcc->owner_id != self::$owner_id)
                ) {
                    throw new \Error("Invalid src_id specified");
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
                throw new \Error("Invalid dest_id specified");
            }

            // Check user and owner of account
            if ($res["dest_id"]) {
                $destAcc = $this->accModel->getItem($res["dest_id"]);
                if (
                    !$destAcc
                    || $destAcc->user_id != self::$user_id
                    || ($res["type"] != DEBT && $destAcc->owner_id != self::$owner_id)
                ) {
                    throw new \Error("Invalid dest_id specified");
                }
            }
        }

        // Check source and destination are not the same
        if ($res["src_id"] && $res["dest_id"] && $res["src_id"] == $res["dest_id"]) {
            throw new \Error("Source and destination are the same.");
        }

        if (isset($params["src_amount"])) {
            $res["src_amount"] = floatval($params["src_amount"]);
            if ($res["src_amount"] == 0.0) {
                throw new \Error("Invalid src_amount specified");
            }
        }

        if (isset($params["dest_amount"])) {
            $res["dest_amount"] = floatval($params["dest_amount"]);
            if ($res["dest_amount"] == 0.0) {
                throw new \Error("Invalid dest_amount specified");
            }
        }

        if (isset($params["src_curr"])) {
            $res["src_curr"] = intval($params["src_curr"]);
            if (
                !$this->currMod->isExist($res["src_curr"]) ||
                ($srcAcc && $srcAcc->curr_id != $res["src_curr"])
            ) {
                throw new \Error("Invalid src_curr specified");
            }
        }

        if (isset($params["dest_curr"])) {
            $res["dest_curr"] = intval($params["dest_curr"]);
            if (
                !$this->currMod->isExist($res["dest_curr"]) ||
                ($destAcc && $destAcc->curr_id != $res["dest_curr"])
            ) {
                throw new \Error("Invalid dest_curr specified");
            }
        }

        if (isset($params["date"])) {
            $res["date"] = is_string($params["date"]) ? strtotime($params["date"]) : intval($params["date"]);
            if (!$res["date"]) {
                throw new \Error("Invalid date specified");
            }
        }

        if (isset($params["comment"])) {
            $res["comment"] = $this->dbObj->escape($params["comment"]);
        }

        return $res;
    }


    // Convert debt specific params to transaction object
    public function prepareDebt($params)
    {
        $mandatoryParams = [
            "person_id",
            "op",
            "src_amount",
            "dest_amount",
            "src_curr",
            "dest_curr",
            "date",
            "comment"
        ];

        checkFields($params, $mandatoryParams, true);

        $res = [
            "type" => DEBT,
        ];

        if (isset($params["id"])) {
            $res["id"] = intval($params["id"]);
        }

        $op = intval($params["op"]);
        if ($op != 1 && $op != 2) {
            throw new \Error("Unknown debt operation: $op");
        }

        $person_id = intval($params["person_id"]);

        $res["src_curr"] = intval($params["src_curr"]);
        $res["dest_curr"] = intval($params["dest_curr"]);
        if (!$res["src_curr"] || !$res["dest_curr"]) {
            throw new \Error("Invalid currency");
        }

        $curr_id = ($op == 1) ? $res["src_curr"] : $res["dest_curr"];
        $personAccount = $this->accModel->getPersonAccount($person_id, $curr_id);
        if (!$personAccount) {
            $personAccount = $this->accModel->createPersonAccount($person_id, $curr_id);
        }
        if (!$personAccount) {
            throw new \Error("Fail to obtain person account: person_id: $person_id, curr_id: $curr_id");
        }

        $account_id = isset($params["acc_id"]) ? intval($params["acc_id"]) : 0;

        if ($op == 1) {        // give
            $res["src_id"] = $personAccount->id;
            $res["dest_id"] = $account_id;
        } elseif ($op == 2) {    // take
            $res["src_id"] = $account_id;
            $res["dest_id"] = $personAccount->id;
        }

        $res["src_amount"] = floatval($params["src_amount"]);
        $res["dest_amount"] = floatval($params["dest_amount"]);
        if ($res["src_amount"] == 0.0 || $res["dest_amount"] == 0.0) {
            throw new \Error("Invalid amount");
        }

        $res["date"] = $params["date"];
        $res["comment"] = $params["comment"];

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

            $res = $this->validateParams($item);

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
        $res = $this->validateParams($params);

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
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }
        if ($item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $res = $this->validateParams($params, $item_id);

        $this->originalTrans = $item;

        $canceled = $this->cancelTransaction($item);
        $this->balanceChanges = $this->applyTransaction($res, $canceled);

        // check date is changed
        $orig_date = getdate($item->date);
        $target_date = getdate($res["date"]);

        $orig_time = mktime(0, 0, 0, $orig_date["mon"], $orig_date["mday"], $orig_date["year"]);
        $target_time = mktime(0, 0, 0, $target_date["mon"], $target_date["mday"], $target_date["year"]);

        if ($orig_time != $target_time) {
            $res["pos"] = 0;
        } else {
            $res["pos"] = $item->pos;
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


    // Delete all transactions of user
    public function reset($keepAccountBalance = false)
    {
        $setCond = inSetCondition(self::$user_id);
        if (is_null($setCond)) {
            return true;
        }

        // Prepare balance updates for accounts
        $userAccounts = $this->accModel->getData(["full" => true, "type" => "all"]);
        $balanceChanges = [];
        foreach ($userAccounts as $account) {
            if ($keepAccountBalance) {
                $balanceChanges[$account->id] = $account->balance;
            } else {
                $balanceChanges[$account->id] = $account->initbalance;
            }
        }
        $this->accModel->updateBalances($balanceChanges);

        // delete all transactions of user
        if (!$this->dbObj->deleteQ("transactions", "user_id" . $setCond)) {
            return false;
        }

        $this->cleanCache();

        return true;
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


    // Return list of accounts of specified persons
    private function getPersonAccounts($persons = null)
    {
        if (is_null($persons)) {
            return null;
        }

        if (!is_array($persons)) {
            $persons = [$persons];
        }
        $res = [];
        foreach ($persons as $personId) {
            $accounts = $this->accModel->getData(["person" => $personId]);
            if (count($accounts) > 0) {
                foreach ($accounts as $account) {
                    $res[] = $account->id;
                }
            } else {
                $res[] = -1;
            }
        }

        return $res;
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

    // Convert request object to transaction request parameters
    public function getRequestFilters($request, $defaults = [], $throw = false)
    {
        $res = $defaults;

        // Type filter
        $typeFilter = [];
        if (isset($request["type"])) {
            $typeReq = $request["type"];
            if (!is_array($typeReq)) {
                $typeReq = [$typeReq];
            }

            foreach ($typeReq as $type_str) {
                $type_id = intval($type_str);
                if (!$type_id) {
                    $type_id = self::stringToType($type_str);
                }
                if (is_null($type_id) && $throw) {
                    throw new \Error("Invalid type '$type_str'");
                }
                if ($type_id) {
                    $typeFilter[] = $type_id;
                }
            }
            if (count($typeFilter) > 0) {
                $res["type"] = $typeFilter;
            }
        }

        // Accounts filter
        $accFilter = [];
        if (isset($request["acc_id"])) {
            $accountsReq = $request["acc_id"];
            if (!is_array($accountsReq)) {
                $accountsReq = [$accountsReq];
            }
            foreach ($accountsReq as $acc_id) {
                if ($this->accModel->isExist($acc_id)) {
                    $accFilter[] = intval($acc_id);
                } elseif ($throw) {
                    throw new \Error("Invalid account '$acc_id'");
                }
            }
            if (count($accFilter) > 0) {
                $res["accounts"] = $accFilter;
            }
        }

        // Persons filter
        $personModel = PersonModel::getInstance();
        $personFilter = [];
        if (isset($request["person_id"])) {
            $personsReq = $request["person_id"];
            if (!is_array($personsReq)) {
                $personsReq = [$personsReq];
            }
            foreach ($personsReq as $person_id) {
                if ($personModel->isExist($person_id)) {
                    $personFilter[] = intval($person_id);
                } elseif ($throw) {
                    throw new \Error("Invalid person '$person_id'");
                }
            }
            if (count($personFilter) > 0) {
                $res["persons"] = $personFilter;
            }
        }

        // Search query
        if (isset($request["search"]) && !is_null($request["search"])) {
            $res["search"] = $request["search"];
        }

        // Date range filter
        $stDate = (isset($_GET["stdate"]) ? $_GET["stdate"] : null);
        $endDate = (isset($_GET["enddate"]) ? $_GET["enddate"] : null);
        if (!is_null($stDate) && !is_null($endDate)) {
            $res["startDate"] = $stDate;
            $res["endDate"] = $endDate;
        }

        // Page
        if (isset($request["page"])) {
            $page = intval($request["page"]);
            if ($page > 1) {
                $res["page"] = $page - 1;
            }
        }

        return $res;
    }

    // Conver filter parameters to filter object
    public function getFilterObject($params)
    {
        $res = [];

        // Type
        if (
            isset($params["type"]) &&
            is_array($params["type"]) &&
            count($params["type"]) > 0
        ) {
            $res["type"] = $params["type"];
        }

        // Accounts
        if (
            isset($params["accounts"]) &&
            is_array($params["accounts"]) &&
            count($params["accounts"]) > 0
        ) {
            $res["acc_id"] = $params["accounts"];
        }

        // Persons
        if (
            isset($params["persons"]) &&
            is_array($params["persons"]) &&
            count($params["persons"]) > 0
        ) {
            $res["person_id"] = $params["persons"];
        }

        // Date range
        if (isset($params["startDate"]) && $params["endDate"]) {
            $res["stdate"] = $params["startDate"];
            $res["enddate"] = $params["endDate"];
        }

        // Search query
        if (isset($params["search"])) {
            $res["search"] = $params["search"];
        }

        return $res;
    }


    // Returns array of DB conditions
    private function getDBCondition($params = null)
    {
        if (is_null($params)) {
            $params = [];
        }

        $res = ["user_id=" . self::$user_id];

        // Transaction type condition
        if (isset($params["type"])) {
            $typeCond = $this->getTypeCondition($params["type"]);
            if (!is_empty($typeCond)) {
                $res[] = $typeCond;
            }
        }

        $accountsToFilter = [];

        // Persons filter condition
        if (isset($params["persons"]) && !is_null($params["persons"])) {
            $personAccounts = $this->getPersonAccounts($params["persons"]);
            if (!is_null($personAccounts)) {
                $accountsToFilter = $personAccounts;
            }
        }

        // Accounts filter condition
        if (isset($params["accounts"]) && !is_null($params["accounts"])) {
            $userAccounts = $params["accounts"];
            if (!is_array($userAccounts)) {
                $userAccounts = [$userAccounts];
            }

            array_push($accountsToFilter, ...$userAccounts);
        }

        if (count($accountsToFilter) > 0) {
            $accCond = $this->getAccCondition($accountsToFilter);
            if (!is_empty($accCond)) {
                $res[] = $accCond;
            }
        }

        // Search condition
        if (isset($params["search"]) && !is_null($params["search"])) {
            $sReq = $this->dbObj->escape($params["search"]);
            if (!is_empty($sReq)) {
                $res[] = "comment LIKE '%" . $sReq . "%'";
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

                $res[] = "date >= " . qnull($fstdate);
                $res[] = "date <= " . qnull($fenddate);
            }
        }

        return $res;
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
    //   page - page to return. zero based
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

        $condArr = $this->getDBCondition($params);

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

        $condArr = $this->getDBCondition($params);

        return $this->dbObj->countQ($this->tbl_name, $condArr);
    }


    protected function getLabel($time, $groupType)
    {
        if ($groupType == NO_GROUP || $groupType == GROUP_BY_DAY || $groupType == GROUP_BY_WEEK) {
            return date("d.m.Y", $time);
        }

        if ($groupType == GROUP_BY_MONTH) {
            return date("m.Y", $time);
        }

        if ($groupType == GROUP_BY_YEAR) {
            return date("Y", $time);
        }

        return null;
    }


    // Convert request object to histogram request parameters
    public function getHistogramFilters($request)
    {
        $currModel = CurrencyModel::getInstance();
        $accModel = AccountModel::getInstance();

        $res = new \stdClass();

        // Filter type
        $byCurrency = (isset($request["filter"]) && $request["filter"] == "currency");
        $res->filter = $byCurrency ? "currency" : "account";

        // Transaction type
        $trans_type = (isset($request["type"])) ? $request["type"] : EXPENSE;
        if (!is_array($trans_type)) {
            $trans_type = [$trans_type];
        }

        $transTypes = [];
        foreach ($trans_type as $type) {
            $intType = intval($type);
            if (!$intType) {
                throw new \Error("Invalid transaction type");
            }
            $transTypes[] = $intType;
        }
        $res->type = $transTypes;

        // Currency or account
        if ($byCurrency) {
            if (isset($request["curr_id"]) && is_numeric($request["curr_id"])) {
                $curr_id = intval($request["curr_id"]);
                if (!$currModel->isExist($curr_id)) {
                    throw new \Error("Currency not found");
                }
            } else { // try to get first currency
                $curr_id = $currModel->getIdByPos(0);
                if (!$curr_id) {
                    throw new \Error("No currencies available");
                }
            }
            $res->curr_id = $curr_id;
        } else {
            if (isset($request["acc_id"]) && is_numeric($request["acc_id"])) {
                $acc_id = intval($request["acc_id"]);
                if (!$accModel->isExist($acc_id)) {
                    throw new \Error("Account not found");
                }
            } else { // try to get first account of user
                $acc_id = $accModel->getIdByPos(0);
                if (!$acc_id) {
                    throw new \Error("No accounts available");
                }
            }
            $res->acc_id = $acc_id;
        }

        // Group type
        if (isset($request["group"])) {
            $groupType = self::getHistogramGroupTypeByName($request["group"]);
            if ($groupType != 0) {
                $res->group = strtolower($request["group"]);
            }
        }

        $stDate = isset($request["stdate"]) ? $request["stdate"] : null;
        $endDate = isset($request["enddate"]) ? $request["enddate"] : null;
        if (!is_null($stDate) && !is_null($endDate)) {
            $res->stdate = $stDate;
            $res->enddate = $endDate;
        }

        return $res;
    }


    // Return series array of amounts and date of transactions for statistics histogram
    public function getHistogramSeries($params = null)
    {
        if (is_null($params)) {
            $params = [];
        }

        $byCurrency = (isset($params["filter"]) && $params["filter"] == "currency");
        if ($byCurrency) {
            if (!isset($params["curr_id"])) {
                return null;
            }

            $curr_id = intval($params["curr_id"]);
            $acc_id = 0;
        } else {
            if (!isset($params["acc_id"])) {
                return null;
            }

            $acc_id = intval($params["acc_id"]);
            $curr_id = 0;
        }

        $amountArr = [];
        $groupArr = [];
        $sumDate = null;
        $curDate = null;
        $prevDate = null;
        $curSum = [];
        $itemsInGroup = 0;
        $trans_time = 0;

        $typesReq = (isset($params["type"])) ? $params["type"] : EXPENSE;
        if (!is_array($typesReq)) {
            $typesReq = [$typesReq];
        }

        $transTypes = [];
        foreach ($typesReq as $type) {
            $intType = intval($type);
            if (!$intType) {
                return null;
            }

            $transTypes[] = $intType;
            $amountArr[$intType] = [];
            $curSum[$intType] = 0.0;
        }

        $group_type = (isset($params["group"])) ? intval($params["group"]) : NO_GROUP;
        $limit = (isset($params["limit"])) ? intval($params["limit"]) : 0;
        if (!self::$user_id || !count($transTypes)) {
            return null;
        }

        $dataParams = [
            "type" => $transTypes,
        ];
        if ($acc_id) {
            $dataParams["accounts"] = $acc_id;
        }
        if (
            isset($params["startDate"]) && !is_null($params["startDate"]) &&
            isset($params["endDate"]) && !is_null($params["endDate"])
        ) {
            $dataParams["startDate"] = $params["startDate"];
            $dataParams["endDate"] = $params["endDate"];
        }

        $items = $this->getData($dataParams);
        foreach ($items as $item) {
            if (!in_array($item->type, $transTypes)) {
                continue;
            }

            if ($byCurrency) {
                $transCurr = ($item->type == EXPENSE) ? $item->src_curr : $item->dest_curr;
                if ($transCurr != $curr_id) {
                    continue;
                }
            } else {
                $transAcc = ($item->type == EXPENSE) ? $item->src_id : $item->dest_id;
                if ($transAcc != $acc_id) {
                    continue;
                }
            }

            $trans_time = $item->date;
            $dateInfo = getdate($trans_time);
            $itemsInGroup++;

            if ($group_type == NO_GROUP) {
                if ($item->type == EXPENSE) {
                    $amountArr[$item->type][] = $item->src_amount;
                } else {
                    $amountArr[$item->type][] = $item->dest_amount;
                }

                if ($prevDate == null || $prevDate != $dateInfo["mday"]) {
                    $groupArr[] = [date("d.m.Y", $trans_time), $itemsInGroup];
                    $itemsInGroup = 0;
                }
                $prevDate = $dateInfo["mday"];
            } elseif ($group_type == GROUP_BY_DAY) {
                $curDate = $dateInfo["mday"];
            } elseif ($group_type == GROUP_BY_WEEK) {
                $curDate = intval(date("W", $trans_time));
            } elseif ($group_type == GROUP_BY_MONTH) {
                $curDate = $dateInfo["mon"];
            } elseif ($group_type == GROUP_BY_YEAR) {
                $curDate = $dateInfo["year"];
            }

            if ($sumDate == null) {        // first iteration
                $sumDate = $curDate;
            } elseif ($sumDate != null && $sumDate != $curDate) {
                $sumDate = $curDate;
                foreach ($transTypes as $type) {
                    $amountArr[$type][] = $curSum[$type];
                    $curSum[$type] = 0.0;
                }

                $label = $this->getLabel($trans_time, $group_type);
                $groupArr[] = [$label, 1];
            }

            if ($item->type == EXPENSE) {
                $curSum[$item->type] += $item->src_amount;
            } else {
                $curSum[$item->type] += $item->dest_amount;
            }
        }

        // save remain value
        if ($group_type != 0 && array_sum($curSum) != 0.0) {
            if ($sumDate != null && $sumDate != $curDate) {
                foreach ($transTypes as $type) {
                    $amountArr[$type][] = $curSum[$type];
                }

                $label = $this->getLabel($trans_time, $group_type);
                $groupArr[] = [$label, 1];
            } else {
                foreach ($transTypes as $type) {
                    $length = count($amountArr[$type]);
                    if (!$length) {
                        $amountArr[$type][] = $curSum[$type];
                    } else {
                        $amountArr[$type][$length - 1] += $curSum[$type];
                    }
                }

                if (!count($groupArr)) {
                    $label = $this->getLabel($trans_time, $group_type);
                    $groupArr[] = [$label, 1];
                } elseif ($group_type == 0) {
                    $groupArr[count($groupArr) - 1][1]++;
                }
            }
        }

        if ($limit > 0) {
            $amountCount = 0;
            foreach ($amountArr as $type => $values) {
                $amountCount = max(count($values), $amountCount);
            }

            $limitCount = min($amountCount, $limit);

            $trimAmounts = [];
            foreach ($amountArr as $type => $values) {
                $trimAmounts[$type] = array_slice($values, -$limitCount);
            }
            $amountArr = $trimAmounts;

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

        $resultValues = [];
        foreach ($amountArr as $type => $values) {
            $resultValues[] = ["data" => $values];
        }
        if (count($transTypes) == 1) {
            $resultValues = $resultValues[0]["data"];
        }

        $res = new \stdClass();
        $res->values = $resultValues;
        $res->series = $groupArr;

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


    public static function getHistogramGroupTypeByName($name)
    {
        $lname = strtolower($name);
        foreach (self::$histogramGroupNames as $index => $groupName) {
            if ($lname == strtolower($groupName)) {
                return $index;
            }
        }

        return NO_GROUP;
    }

    // Return array of histogram group names
    public static function getHistogramGroupNames()
    {
        return self::$histogramGroupNames;
    }
}
