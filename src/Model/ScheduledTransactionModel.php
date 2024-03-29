<?php

namespace JezveMoney\App\Model;

use JezveMoney\App\Item\ScheduledTransactionItem;
use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Model;
use JezveMoney\Core\Singleton;

use function JezveMoney\Core\inSetCondition;

/**
 * Scheduled transactions model
 */
class ScheduledTransactionModel extends CachedTable
{
    use Singleton;

    public static $availIntervals = [
        INTERVAL_NONE,
        INTERVAL_DAY,
        INTERVAL_WEEK,
        INTERVAL_MONTH,
        INTERVAL_YEAR,
    ];

    protected static $user_id = 0;
    protected static $owner_id = 0;

    protected $tbl_name = "scheduled_transactions";
    protected $accModel = null;
    protected $currMod = null;
    protected $catModel = null;
    protected $offsetsModel = null;
    protected $reminderModel = null;
    protected $affectedItems = null;
    protected $intervalOffsets = false;
    protected $remindersChanged = false;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();

        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();

        $this->accModel = AccountModel::getInstance();
        $this->currMod = CurrencyModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
        $this->offsetsModel = IntervalOffsetModel::getInstance();
        $this->reminderModel = ReminderModel::getInstance();
        TransactionModel::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return ScheduledTransactionItem|null
     */
    protected function rowToObj(?array $row)
    {
        return ScheduledTransactionItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name, "user_id=" . self::$user_id);
    }

    /**
     * Validates item fields before to send create/update request to database
     *
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return array
     */
    protected function validateParams(array $params, int $item_id = 0)
    {
        $avFields = [
            "type",
            "name",
            "src_id",
            "dest_id",
            "src_amount",
            "dest_amount",
            "src_curr",
            "dest_curr",
            "category_id",
            "comment",
            "start_date",
            "end_date",
            "interval_type",
            "interval_step",
            "interval_offset",
        ];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }
        $item = ($item_id) ? $this->getItem($item_id) : null;

        if (isset($params["name"]) || is_null($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        } else {
            $res["name"] = $item->name;
        }

        if (isset($params["type"])) {
            $res["type"] = intval($params["type"]);
            if (!in_array($res["type"], TransactionModel::$availTypes)) {
                throw new \Error("Invalid type specified");
            }
        } else {
            $res["type"] = $item->type;
        }

        $srcAcc = null;
        if (isset($params["src_id"])) {
            $res["src_id"] = intval($params["src_id"]);
            // Check set state of account according to type of transaction
            if (
                ($res["src_id"] && !in_array($res["type"], TransactionModel::$srcAvailTypes)) ||
                (!$res["src_id"] && in_array($res["type"], TransactionModel::$srcMandatoryTypes))
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
                ($res["dest_id"] && !in_array($res["type"], TransactionModel::$destAvailTypes)) ||
                (!$res["dest_id"] && in_array($res["type"], TransactionModel::$destMandatoryTypes))
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
        if (
            isset($res["src_id"])
            && isset($res["dest_id"])
            && $res["src_id"] == $res["dest_id"]
        ) {
            throw new \Error("Source and destination are the same.");
        }

        // Category
        $res["category_id"] = (isset($params["category_id"])) ? intval($params["category_id"]) : 0;
        if ($res["category_id"] !== 0 && !$this->catModel->isExist($res["category_id"])) {
            throw new \Error("Invalid category_id specified");
        }

        // Source currency
        if (isset($params["src_curr"])) {
            $res["src_curr"] = intval($params["src_curr"]);
            if (
                !$this->currMod->isExist($res["src_curr"]) ||
                ($srcAcc && $srcAcc->curr_id != $res["src_curr"])
            ) {
                throw new \Error("Invalid src_curr specified");
            }
        }
        $srcCurrId = (isset($res["src_curr"])) ? $res["src_curr"] : $item->src_curr;
        $sourceCurrency = $this->currMod->getItem($srcCurrId);

        // Check source currency is the same as currency of source account
        if ($srcAcc && $srcAcc->curr_id !== $srcCurrId) {
            throw new \Error("src_curr is not the same as currency of source account");
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
        $destCurrId = (isset($res["dest_curr"])) ? $res["dest_curr"] : $item->dest_curr;
        $destCurrency = $this->currMod->getItem($destCurrId);

        // Check destination currency is the same as currency of destination account
        if ($destAcc && $destAcc->curr_id !== $destCurrId) {
            throw new \Error("dest_curr is not the same as currency of destination account");
        }

        // Source amount
        if (isset($params["src_amount"])) {
            $res["src_amount"] = normalize($params["src_amount"], $sourceCurrency->precision);
            if ($res["src_amount"] <= 0.0) {
                throw new \Error("Invalid src_amount specified");
            }
        }
        $srcAmount = (isset($res["src_amount"])) ? $res["src_amount"] : $item->src_amount;

        // Destination amount
        if (isset($params["dest_amount"])) {
            $res["dest_amount"] = normalize($params["dest_amount"], $destCurrency->precision);
            if ($res["dest_amount"] <= 0.0) {
                throw new \Error("Invalid dest_amount specified");
            }
        }
        $destAmount = (isset($res["dest_amount"])) ? $res["dest_amount"] : $item->dest_amount;

        if ($srcCurrId === $destCurrId && $srcAmount != $destAmount) {
            throw new \Error("src_amount and dest_amount must be equal when src_curr and dest_curr are same");
        }

        if ($res["type"] == DEBT) {
            if (
                $srcAcc
                && $srcAcc->owner_id !== self::$owner_id
                && $destAcc
                && $destAcc->owner_id !== self::$owner_id
            ) {
                throw new \Error("Both source and destination are accounts of person");
            }

            if (
                (!$srcAcc || $srcAcc->owner_id === self::$owner_id)
                && (!$destAcc || $destAcc->owner_id === self::$owner_id)
            ) {
                throw new \Error("Neither source nor destination are accounts of person");
            }
        }

        if (array_key_exists("start_date", $params)) {
            $res["start_date"] = intval($params["start_date"]);
            if (!$res["start_date"]) {
                throw new \Error("Invalid start date specified");
            }
        } else {
            $res["start_date"] = $item->start_date;
        }

        if (array_key_exists("end_date", $params)) {
            $res["end_date"] = ($params["end_date"]) ? intval($params["end_date"]) : null;
            if (!is_null($res["end_date"]) && $res["end_date"] < $res["start_date"]) {
                throw new \Error("Invalid end date specified");
            }
        }

        if (isset($params["comment"])) {
            $res["comment"] = $this->dbObj->escape($params["comment"]);
        }

        if (isset($params["interval_type"])) {
            $res["interval_type"] = $this->validateIntervalType($params["interval_type"]);
        } else {
            $res["interval_type"] = $item->interval_type;
        }

        if (isset($params["interval_step"])) {
            $res["interval_step"] = intval($params["interval_step"]);
            if ($res["interval_step"] < 0) {
                throw new \Error("Invalid interval step specified");
            }
        }

        if (isset($params["interval_offset"])) {
            $intervalOffsets = asArray($params["interval_offset"]);
            $res["interval_offset"] = [];
            foreach ($intervalOffsets as $offset) {
                $res["interval_offset"][] = $this->validateIntervalOffset(
                    $offset,
                    $res["interval_type"],
                );
            }
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same scheduled transaction already exist");
        }

        return $res;
    }

    /**
     * Checks same item already exist
     *
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function isSameItemExist(array $params, int $item_id = 0)
    {
        if (!is_array($params) || !isset($params["name"])) {
            return false;
        }

        $foundItem = $this->findByName($params["name"]);
        return ($foundItem && $foundItem->id != $item_id);
    }

    /**
     * Validates interval type value
     *
     * @param mixed $value
     *
     * @return int
     */
    protected function validateIntervalType(mixed $value)
    {
        $type = intval($value);
        if (!in_array($type, self::$availIntervals)) {
            throw new \Error("Invalid interval type specified");
        }

        return $type;
    }

    /**
     * Validates offset value for specified interval type
     *
     * @param mixed $value
     * @param int $type
     *
     * @return int
     */
    protected function validateIntervalOffset(mixed $value, int $type)
    {
        $offset = intval($value);

        $this->validateIntervalType($type);

        if ($type === INTERVAL_NONE) {
            if ($offset !== 0) {
                throw new \Error("Invalid interval offset specified");
            }
        } elseif ($type === INTERVAL_DAY) {
            if ($offset !== 0) {
                throw new \Error("Invalid offset for day interval specified");
            }
        } elseif ($type === INTERVAL_WEEK) {
            if ($offset < 0 || $offset >= DAYS_IN_WEEK) {
                throw new \Error("Invalid offset for week interval specified");
            }
        } elseif ($type === INTERVAL_MONTH) {
            if ($offset < 0 || $offset >= MAX_DAYS_IN_MONTH) {
                throw new \Error("Invalid offset for month interval specified");
            }
        } elseif ($type === INTERVAL_YEAR) {
            $monthIndex = floor($offset / 100);
            $dayIndex = ($offset % 100);
            if (
                $monthIndex < 0
                || $monthIndex >= MONTHS_IN_YEAR
                || $dayIndex < 0
                || $dayIndex >= MAX_DAYS_IN_MONTH
            ) {
                throw new \Error("Invalid offset for year interval specified");
            }
        }

        return $offset;
    }

    /**
     * Converts debt specific params to common transaction fields
     *
     * @param array $params debt fields
     *
     * @return array
     */
    public function prepareDebt(array $params)
    {
        $mandatoryParams = [
            "name",
            "person_id",
            "op",
            "src_amount",
            "dest_amount",
            "src_curr",
            "dest_curr",
            "category_id",
            "comment",
            "start_date",
            "end_date",
            "interval_type",
            "interval_step",
            "interval_offset",
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

        $personCurrencyId = ($op == 1) ? $res["src_curr"] : $res["dest_curr"];
        $personAccount = $this->accModel->getPersonAccount($person_id, $personCurrencyId);
        if (!$personAccount) {
            $personAccount = $this->accModel->createPersonAccount($person_id, $personCurrencyId);
        }
        if (!$personAccount) {
            throw new \Error("Fail to obtain person account: person_id: $person_id, curr_id: $personCurrencyId");
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

        $res["category_id"] = $params["category_id"];
        $res["comment"] = $params["comment"];

        $res["name"] = $params["name"];
        $res["start_date"] = $params["start_date"];
        $res["end_date"] = $params["end_date"];
        $res["interval_type"] = $params["interval_type"];
        $res["interval_step"] = $params["interval_step"];
        $res["interval_offset"] = $params["interval_offset"];

        return $res;
    }

    /**
     * Saves affected transactions to database
     *
     * @return bool
     */
    protected function commitAffected()
    {
        if (
            !isset($this->affectedItems) ||
            !is_array($this->affectedItems) ||
            !count($this->affectedItems)
        ) {
            return false;
        }

        $curDate = date("Y-m-d H:i:s");

        foreach ($this->affectedItems as $item_id => $item) {
            $item = (array)$item;

            $res = $this->validateParams($item, $item_id);

            unset($res["interval_offset"]);

            $res["start_date"] = date("Y-m-d H:i:s", $item["start_date"]);
            $res["end_date"] = ($item["end_date"]) ? date("Y-m-d H:i:s", $item["end_date"]) : null;

            if (is_string($item["createdate"])) {
                $res["createdate"] = $item["createdate"];
            } else {
                $res["createdate"] = date("Y-m-d H:i:s", $item["createdate"]);
            }

            $res["updatedate"] = $curDate;
            $res["user_id"] = self::$user_id;
            $res["id"] = $item["id"];

            $this->affectedItems[$item_id] = $res;
        }

        $updResult = $this->dbObj->updateMultipleQ($this->tbl_name, $this->affectedItems);
        $this->affectedItems = null;

        $this->cleanCache();

        return $updResult;
    }

    /**
     * Returns affected transaction object if available
     *
     * @param mixed $item transaction object
     *
     * @return array|object|null
     */
    protected function getAffected(mixed $item)
    {
        if (!$item || !$item->id) {
            return null;
        }

        if (
            is_null($this->affectedItems) ||
            !is_array($this->affectedItems) ||
            !isset($this->affectedItems[$item->id])
        ) {
            return $item;
        }

        return $this->affectedItems[$item->id];
    }

    /**
     * Add item to the affected list
     *
     * @param mixed $item scheduled transaction object
     *
     * @return bool
     */
    protected function pushAffected(mixed $item)
    {
        if (!$item || !$item->id) {
            return false;
        }

        if (!is_array($this->affectedItems)) {
            $this->affectedItems = [];
        }

        $this->affectedItems[$item->id] = $item;

        return true;
    }

    /**
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params item fields
     * @param bool $isMultiple flag for multiple create
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $res = $this->validateParams($params);

        if (!is_array($this->intervalOffsets)) {
            $this->intervalOffsets = [];
        }
        $this->intervalOffsets[] = $res["interval_offset"];
        unset($res["interval_offset"]);

        $res["start_date"] = date("Y-m-d H:i:s", $res["start_date"]);
        $res["end_date"] = ($res["end_date"]) ? date("Y-m-d H:i:s", $res["end_date"]) : null;
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
        $res["user_id"] = self::$user_id;

        return $res;
    }

    /**
     * Performs final steps after new item was successfully created
     *
     * @param int|int[]|null $items id or array of created item ids
     *
     * @return bool
     */
    protected function postCreate(mixed $items)
    {
        parent::postCreate($items);

        $items = asArray($items);
        $params = $this->getRemindersDateRange(true);

        foreach ($items as $index => $item_id) {
            $this->createOffsets($item_id, $this->intervalOffsets[$index]);
            $this->createReminders($item_id, $params);
        }

        $this->intervalOffsets = null;

        return true;
    }

    /**
     * Returns array of interval offsets for specified item
     *
     * @param int $item_id item id
     *
     * @return int[]
     */
    public function getIntervalOffsets(int $item_id)
    {
        return $this->offsetsModel->getOffsetsBySchedule($item_id);
    }

    /**
     * Returns date range for reminders
     *
     * @return array
     */
    protected function getRemindersDateRange($initialRun = false)
    {
        $startDate = null;
        if (!$initialRun) {
            $userModel = UserModel::getInstance();
            $startDate = $userModel->getRemindersDate();
        }

        return [
            "startDate" => $startDate,
            "endDate" => cutDate(UserSettingsModel::clientTime()),
        ];
    }

    /**
     * Checks update conditions and returns array of expressions
     *
     * @param int $item_id item id
     * @param array $params item fields
     *
     * @return array
     */
    protected function preUpdate(int $item_id, array $params)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }
        if ($item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $res = $this->validateParams($params, $item_id);

        $this->intervalOffsets = $res["interval_offset"] ?? null;

        $this->remindersChanged = $this->isRemindersChanged((array)$item, $res);

        unset($res["interval_offset"]);

        $res["start_date"] = date("Y-m-d H:i:s", $res["start_date"]);
        if (isset($res["end_date"])) {
            $res["end_date"] = date("Y-m-d H:i:s", $res["end_date"]);
        }
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Compares items and returns true if reminders must be updated
     *
     * @param array $item
     * @param array $params
     *
     * @return bool
     */
    protected function isRemindersChanged(array $item, array $params)
    {
        if (
            (isset($params["start_date"]) && $params["start_date"] !== $item["start_date"])
            || (isset($params["end_date"]) && $params["end_date"] !== $item["end_date"])
            || (isset($params["interval_type"]) && $params["interval_type"] !== $item["interval_type"])
            || (isset($params["interval_step"]) && $params["interval_step"] !== $item["interval_step"])
        ) {
            return true;
        }

        if (!isset($params["interval_offset"])) {
            return false;
        }

        if (count($params["interval_offset"]) !== count($item["interval_offset"])) {
            return true;
        }

        $intervalOffset = asArray($params["interval_offset"]);
        foreach ($intervalOffset as $offset) {
            if (!in_array($offset, $item["interval_offset"])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Performs model-specific actions after update successfully completed
     *
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();

        if (!is_null($this->intervalOffsets)) {
            $this->updateOffsets($item_id, $this->intervalOffsets);
        }
        $this->intervalOffsets = null;

        if ($this->remindersChanged) {
            $params = $this->getRemindersDateRange(true);
            $this->updateReminders($item_id, $params);
        }

        return true;
    }

    /**
     * Changes end date of scheduled transaction(s) to today
     *
     * @param mixed $ids item id or array of ids
     *
     * @return bool
     */
    public function finish(mixed $ids)
    {
        $ids = asArray($ids);

        $today = cutDate(UserSettingsModel::clientTime());
        $itemsToDelete = [];

        foreach ($ids as $item_id) {
            $item = $this->getItem($item_id);
            if (!$item) {
                throw new \Error("Invalid scheduled transaction");
            }
            if ($item->interval_type === INTERVAL_NONE) {
                continue;
            }

            // Remove scheduled transaction if start date is in future
            if ($item->start_date > $today) {
                $itemsToDelete[] = $item_id;
                continue;
            }

            $finishedItem = clone $item;
            $finishedItem->end_date = $today;

            $this->pushAffected($finishedItem);
        }

        $this->commitAffected();

        $this->del($itemsToDelete);

        return true;
    }

    /**
     * Checks delete conditions and returns bool result
     *
     * @param array $items array of item ids to remove
     *
     * @return bool
     */
    protected function preDelete(array $items)
    {
        foreach ($items as $item_id) {
            // check item is exist
            $itemObj = $this->getItem($item_id);
            if (!$itemObj) {
                return false;
            }

            $this->deleteOffsets($item_id);
            $this->deleteReminders($item_id);
        }

        return true;
    }

    /**
     * Removes all scheduled transactions
     *
     * @return bool
     */
    public function reset()
    {
        if (!self::$user_id) {
            return false;
        }

        $this->reminderModel->reset();
        $this->offsetsModel->reset();

        $condArr = ["user_id=" . self::$user_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Converts request object to transaction request parameters
     *
     * @param array $request
     * @param array $defaults array of default filter values
     * @param bool $throw if true then throws on error
     *
     * @return array
     */
    public function getRequestFilters(array $request, array $defaults = [], bool $throw = false)
    {
        $request = array_merge($defaults, $request);

        $pagination = [];

        // Page
        if (isset($request["page"])) {
            $page = intval($request["page"]);
            if ($page > 1) {
                $pagination["page"] = $page - 1;
            }
        }

        // Limit
        if (isset($request["onPage"])) {
            $onPage = intval($request["onPage"]);
            if ($onPage < 0 && $throw) {
                throw new \Error("Invalid page limit");
            }
            if ($onPage > 0) {
                $pagination["onPage"] = $onPage;
            }
        }

        // Pages range
        if (isset($request["range"])) {
            $range = intval($request["range"]);
            if ($range > 0) {
                $pagination["range"] = $range;
            }
        }

        $itemsCount = $this->getCount();
        $pagination["total"] = $itemsCount;

        // Build data for paginator
        if (isset($pagination["onPage"]) && $pagination["onPage"] > 0) {
            $pagesCount = ceil($itemsCount / $pagination["onPage"]);
            $pagination["pagesCount"] = $pagesCount;
            $page = $pagination["page"] ?? 1;
            $pagination["page"] = min($pagesCount, $page);
        }

        return [
            "pagination" => $pagination,
        ];
    }

    /**
     * Returns array of scheduled transactions
     *
     * @param array $params array of options:
     *
     * @return ScheduledTransactionItem[]
     */
    public function getData(array $params = [])
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        $items = $this->cache;

        $onPage = isset($params["onPage"]) ? intval($params["onPage"]) : 0;
        if ($onPage > 0) {
            $pageNum = isset($params["page"]) ? intval($params["page"]) : 0;
            $pagesRange = isset($params["range"]) ? intval($params["range"]) : 1;
            if ($pagesRange < 1) {
                $pagesRange = 1;
            }

            $itemsCount = $this->getCount();

            $limitOffset = ($onPage * $pageNum);
            $limitRows = min($itemsCount - $limitOffset, $onPage * $pagesRange);

            $items = array_slice($this->cache, $limitOffset, $limitRows);
        }

        foreach ($items as $item) {
            $res[] = clone $item;
        }

        return $res;
    }

    /**
     * Search for scheduled transaction with specified name
     *
     * @param string $name name of scheduled transaction to find
     * @param bool $caseSens case sensitive flag, default is false
     *
     * @return object|null
     */
    public function findByName(string $name, bool $caseSens = false)
    {
        if (is_empty($name)) {
            return null;
        }

        if (!$this->checkCache()) {
            return null;
        }

        if (!$caseSens) {
            $name = strtolower($name);
        }

        foreach ($this->cache as $item) {
            if (
                ($caseSens && $item->name == $name) ||
                (!$caseSens && strtolower($item->name) == $name)
            ) {
                return $item;
            }
        }

        return null;
    }

    /**
     * Handles account update event
     *
     * @param int $acc_id account id
     *
     * @return bool
     */
    public function onAccountUpdate(int $acc_id)
    {
        $accObj = $this->accModel->getItem($acc_id);
        if (!$accObj) {
            return false;
        }

        if (!$this->checkCache()) {
            return false;
        }

        $new_curr = $accObj->curr_id;
        $isCreditCard = $accObj->type === ACCOUNT_TYPE_CREDIT_CARD;

        foreach ($this->cache as $item) {
            $trans = $this->getAffected($item);

            if ($trans->src_id != $acc_id && $trans->dest_id != $acc_id) {
                continue;
            }

            if ($trans->src_id == $acc_id) {
                $trans->src_curr = $new_curr;
                if ($trans->dest_curr == $new_curr) {
                    $trans->src_amount = $trans->dest_amount;
                }

                if ($trans->type === LIMIT_CHANGE && !$isCreditCard) {
                    $trans->type = EXPENSE;
                }
            }

            if ($trans->dest_id == $acc_id) {
                $trans->dest_curr = $new_curr;
                if ($trans->src_curr == $new_curr) {
                    $trans->dest_amount = $trans->src_amount;
                }

                if ($trans->type === LIMIT_CHANGE && !$isCreditCard) {
                    $trans->type = INCOME;
                }
            }

            $this->pushAffected($trans);
        }

        $this->commitAffected();

        return true;
    }

    /**
     * Handles account delete event
     * Removes specified accounts from transactions
     *
     * @param mixed $accounts id or array of account ids
     *
     * @return bool
     */
    public function onAccountDelete(mixed $accounts)
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
            return false;
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
                continue;
            }

            $queryItem = null;

            // check account of person

            // set outgoing debt(person take) as income to destination account
            if ($trans->type == DEBT && in_array($trans->src_id, $personAccounts)) {
                $queryItem = clone $trans;
                $queryItem->type = INCOME;
                $queryItem->src_id = 0;
            }

            // set incoming debt(person give) as expense from source account
            if ($trans->type == DEBT && in_array($trans->dest_id, $personAccounts)) {
                $queryItem = clone $trans;
                $queryItem->type = EXPENSE;
                $queryItem->dest_id = 0;
            }

            // check account of user

            // set outgoing debt(person take) as debt without acc
            if ($trans->type == DEBT && in_array($trans->src_id, $userAccounts)) {
                $queryItem = clone $trans;
                $queryItem->src_id = 0;
            }

            // set incoming debt(person give) as debt without acc
            if ($trans->type == DEBT && in_array($trans->dest_id, $userAccounts)) {
                $queryItem = clone $trans;
                $queryItem->dest_id = 0;
            }

            // set transfer from account as income to destination account
            if ($trans->type == TRANSFER && $srcMatch) {
                $queryItem = clone $trans;
                $queryItem->type = INCOME;
                $queryItem->src_id = 0;
            }

            // set transfer to account as expense from source account
            if ($trans->type == TRANSFER && $destMatch) {
                $queryItem = clone $trans;
                $queryItem->type = EXPENSE;
                $queryItem->dest_id = 0;
            }

            if (!is_null($queryItem)) {
                $this->pushAffected($queryItem);
            }
        }

        $this->commitAffected();

        $this->del($idsToRemove);

        return true;
    }

    /**
     * Handles category delete event
     * Updates scheduled transactions with removed categories
     *
     * @param mixed $categories id or array of category ids
     *
     * @return bool
     */
    public function onCategoryDelete(mixed $categories)
    {
        if (is_null($categories)) {
            return false;
        }

        $categories = asArray($categories);
        if (count($categories) === 0) {
            return true;
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            ["category_id" => 0],
            "category_id" . inSetCondition($categories)
        );
        if (!$updRes) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Creates interval offsets for specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     * @param mixed $value
     *
     * @return bool
     */
    protected function createOffsets(int $item_id, mixed $value)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        $values = asArray($value);

        $res = [];
        foreach ($values as $offset) {
            $monthIndex = floor($offset / 100);
            $dayIndex = ($offset % 100);

            $offsetItem = [
                "schedule_id" => $item_id,
                "month_offset" => $monthIndex,
                "day_offset" => $dayIndex,
            ];

            $res[] = $offsetItem;
        }

        $this->offsetsModel->createMultiple($res);

        $this->cleanCache();

        return true;
    }

    /**
     * Updates interval offsets of specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     * @param mixed $params
     *
     * @return bool
     */
    protected function updateOffsets(int $item_id, mixed $params)
    {
        $this->deleteOffsets($item_id);
        return $this->createOffsets($item_id, $params);
    }

    /**
     * Removes interval offsets of specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     *
     * @return bool
     */
    protected function deleteOffsets(int $item_id)
    {
        $this->offsetsModel->deleteOffsetsBySchedule($item_id);

        $this->cleanCache();

        return true;
    }

    /**
     * Returns array of expected reminders for specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     * @param array $params
     *
     * @return array
     */
    public function getExpectedReminders(int $item_id, array $params = [])
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        $reminderState = $params["state"] ?? REMINDER_UPCOMING;

        $res = [];
        $reminderDates = $item->getReminders($params);
        foreach ($reminderDates as $date) {
            $reminder = [
                "schedule_id" => $item_id,
                "state" => $reminderState,
                "date" => $date,
                "transaction_id" => 0,
            ];

            if (!$this->reminderModel->isSameItemExist($reminder)) {
                $res[] = $reminder;
            }
        }

        return $res;
    }

    /**
     * Returns array for longest interval of scheduled transactions
     *
     * @return ScheduledTransactionItem
     */
    public function getLongestInterval()
    {
        if (!$this->checkCache()) {
            throw new \Error("Failed to update cache");
        }

        $res = null;
        $maxDays = 0;

        foreach ($this->cache as $item) {
            $maxOffset = 0;
            $offsets = asArray($item->interval_offset);
            foreach ($offsets as $offset) {
                if ($item->interval_type === INTERVAL_YEAR) {
                    $monthIndex = floor($offset / 100);
                    $dayIndex = ($offset % 100);
                    $daysOffset = ($monthIndex * 30) + $dayIndex;
                } else {
                    $daysOffset = $offset;
                }

                $maxOffset = max($daysOffset, $maxOffset);
            }

            $days = getIntervalDays($item->interval_type, $item->interval_step) + $maxOffset;

            if (is_null($res) || $days > $maxDays) {
                $res = clone $item;
                $maxDays = $days;
            }
        }

        return $res;
    }

    /**
     * Returns array of expected reminders for all scheduled transaction
     *
     * @param array $params
     *
     * @return array
     */
    public function getAllExpectedReminders(array $params = [])
    {
        if (!$this->checkCache()) {
            throw new \Error("Failed to update cache");
        }

        if (!isset($params["state"])) {
            $params["state"] = REMINDER_UPCOMING;
        }

        $res = [];
        foreach ($this->cache as $item) {
            $reminders = $this->getExpectedReminders($item->id, $params);
            array_push($res, ...$reminders);
        }

        usort(
            $res,
            function ($a, $b) {
                return ($a["date"] === $b["date"])
                    ? $a["schedule_id"] - $b["schedule_id"]
                    : $a["date"] - $b["date"];
            },
        );

        return $res;
    }

    /**
     * Creates reminders for specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     * @param array $params
     *
     * @return bool
     */
    protected function createReminders(int $item_id, array $params = [])
    {
        $params["state"] = REMINDER_ACTIVE;

        $reminders = $this->getExpectedReminders($item_id, $params);
        $this->reminderModel->createMultiple($reminders);

        return true;
    }

    /**
     * Updates reminders of specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     *
     * @return bool
     */
    protected function updateReminders(int $item_id, array $params = [])
    {
        $this->deleteReminders($item_id);
        return $this->createReminders($item_id, $params);
    }

    /**
     * Removes reminders of specified scheduled transaction
     *
     * @param int $item_id scheduled transaction id
     *
     * @return bool
     */
    protected function deleteReminders(int $item_id)
    {
        return $this->reminderModel->deleteRemindersBySchedule($item_id);
    }

    /**
     * Creates transaction reminders for period from last update
     */
    public function updateAllReminders()
    {
        if (!self::$user_id) {
            return;
        }

        $range = $this->getRemindersDateRange();
        $diff = getDateDiff($range["startDate"], $range["endDate"], INTERVAL_DAY);
        if ($diff === 0) {
            return;
        }

        Model::runTransaction(function () use ($range) {
            $userModel = UserModel::getInstance();
            $userModel->setRemindersDate();

            $params = [
                "startDate" => $range["startDate"],
                "endDate" => $range["endDate"],
                "state" => REMINDER_ACTIVE,
            ];
            $reminders = $this->getAllExpectedReminders($params);
            $this->reminderModel->createMultiple($reminders);
        });
    }

    /**
     * Converts request object to reminders request parameters
     *
     * @param array $request
     *
     * @return array
     */
    public function getUpcomingRequestFilters(array $request)
    {
        $filter = [];
        $pagination = [];

        // Page
        $page = isset($request["page"]) ? intval($request["page"]) : DEFAULT_PAGE;
        $page = ($page > 0) ? $page : DEFAULT_PAGE;
        $pagination["page"] = $page;

        // Limit
        $onPage = isset($request["onPage"]) ? intval($request["onPage"]) : DEFAULT_PAGE_LIMIT;
        $onPage = ($onPage > 0) ? $onPage : DEFAULT_PAGE_LIMIT;
        $pagination["onPage"] = $onPage;

        // Pages range
        $range = isset($request["range"]) ? intval($request["range"]) : DEFAULT_PAGE_RANGE;
        $range = ($range > 0) ? $range : DEFAULT_PAGE_RANGE;
        $pagination["range"] = $range;

        // Start date filter
        $startDate = isset($request["startDate"]) ? intval($request["startDate"]) : 0;
        if ($startDate) {
            $filter["startDate"] = $startDate;
        }

        // End date filter
        $endDate = isset($request["endDate"]) ? intval($request["endDate"]) : 0;
        if ($endDate) {
            $filter["endDate"] = $endDate;
        }

        $params = array_merge($filter, $pagination);

        return [
            "filter" => $filter,
            "pagination" => $pagination,
            "params" => $params,
        ];
    }

    /**
     * Returns array of upcoming reminders
     *
     * @param array $params
     *
     * @return array
     */
    public function getUpcomingReminders(array $params = [])
    {
        $today = cutDate(UserSettingsModel::clientTime());
        $tomorrow = getNextDateInterval($today, INTERVAL_DAY);
        $yearAfter = stepInterval($today, INTERVAL_YEAR);

        $request = [
            "startDate" => $params["startDate"] ?? $tomorrow,
            "endDate" => $params["endDate"] ?? $yearAfter,
        ];

        $pagination = [];

        $page = $params["page"] ?? DEFAULT_PAGE;
        $onPage = $params["onPage"] ?? DEFAULT_PAGE_LIMIT;
        $range = $params["range"] ?? DEFAULT_PAGE_RANGE;

        $firstItemIndex = ($page - 1) * $onPage;
        $lastItemIndex = ($page + $range - 1) * $onPage;

        $longestInterval = $this->getLongestInterval();

        if ($longestInterval) {
            $request["endDate"] = stepInterval(
                $request["endDate"],
                $longestInterval->interval_type,
                $longestInterval->interval_step + 1,
            );
        }

        $prevCount = 0;
        $reminders = $this->getAllExpectedReminders($request);
        $remindersCount = count($reminders);

        if (isset($params["endDate"]) && $onPage > 0) {
            $pagination["total"] = $remindersCount;

            $pagesCount = ceil($remindersCount / $onPage);
            $pagination["pagesCount"] = $pagesCount;

            $page = min($pagesCount, $page);
            $range = min($pagesCount - $page + 1, $range);
        }

        $pagination["onPage"] = $onPage;
        $pagination["page"] = $page;
        $pagination["range"] = $range;

        while (
            !isset($params["endDate"])
            && $remindersCount > $prevCount
            && $remindersCount < $lastItemIndex
        ) {
            $request["endDate"] = stepInterval(
                $request["endDate"],
                $longestInterval->interval_type,
                $longestInterval->interval_step + 1,
            );
            $reminders = $this->getAllExpectedReminders($request);
            $prevCount = $remindersCount;
            $remindersCount = count($reminders);
        }

        $items = [];
        if ($firstItemIndex < $remindersCount) {
            $resultLength = $lastItemIndex - $firstItemIndex;
            $items = array_slice($reminders, $firstItemIndex, $resultLength);
        }

        return [
            "items" => $items,
            "pagination" => $pagination,
        ];
    }
}
