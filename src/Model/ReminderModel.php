<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\ReminderItem;

use function JezveMoney\Core\inSetCondition;

// Reminder state
define("REMINDER_SCHEDULED", 1);
define("REMINDER_CONFIRMED", 2);
define("REMINDER_CANCELLED", 3);

/**
 * Scheduled transactions reminder model
 */
class ReminderModel extends CachedTable
{
    use Singleton;

    public static $availStates = [
        REMINDER_SCHEDULED,
        REMINDER_CONFIRMED,
        REMINDER_CANCELLED,
    ];

    protected static $user_id = 0;
    protected static $owner_id = 0;

    protected $tbl_name = "reminders";

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();

        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();
        self::$owner_id = $uMod->getOwner();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return ReminderItem|null
     */
    protected function rowToObj(?array $row)
    {
        return ReminderItem::fromTableRow($row);
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
        $avFields = ["schedule_id", "state", "date", "transaction_id"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }
        $item = ($item_id) ? $this->getItem($item_id) : null;

        if (isset($params["schedule_id"])) {
            $res["schedule_id"] = intval($params["schedule_id"]);
            $scheduleModel = ScheduledTransactionModel::getInstance();
            $schedule = $scheduleModel->getItem($res["schedule_id"]);
            if (!$schedule || $schedule->user_id !== self::$user_id) {
                throw new \Error("Invalid schedule_id specified");
            }
        } else {
            $res["schedule_id"] = $item->schedule_id;
        }

        if (isset($params["state"])) {
            $res["state"] = intval($params["state"]);
            if (!in_array($res["state"], self::$availStates)) {
                throw new \Error("Invalid state specified");
            }
        } else {
            $res["state"] = $item->state;
        }

        if (isset($params["date"])) {
            $res["date"] = intval($params["date"]);
            if (!$res["date"]) {
                throw new \Error("Invalid date specified");
            }
        } else {
            $res["date"] = $item->date;
        }

        if (isset($params["transaction_id"])) {
            $res["transaction_id"] = intval($params["transaction_id"]);
            if ($res["transaction_id"] !== 0) {
                $transactionModel = TransactionModel::getInstance();
                $transaction = $transactionModel->getItem($res["transaction_id"]);
                if (!$transaction || $transaction->user_id !== self::$user_id) {
                    throw new \Error("Invalid transaction_id specified");
                }
            }
        } else {
            $res["transaction_id"] = $item->transaction_id;
        }

        if (
            ($res["state"] === REMINDER_CONFIRMED && $res["transaction_id"] === 0)
            || ($res["state"] !== REMINDER_CONFIRMED && $res["transaction_id"] !== 0)
        ) {
            throw new \Error("Invalid transaction_id");
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same reminder already exist");
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
    public function isSameItemExist(array $params, int $item_id = 0)
    {
        if (!is_array($params) || !isset($params["schedule_id"]) || !isset($params["date"])) {
            return false;
        }

        $items = $this->getData(["schedule_id" => $params["schedule_id"], "date" => $params["date"]]);
        $foundItem = (count($items) > 0) ? $items[0] : null;
        if ($foundItem && $foundItem->id != $item_id) {
            return true;
        }

        if ($params["transaction_id"] !== 0) {
            $items = $this->getData(["transaction_id" => $params["transaction_id"]]);
            $foundItem = (count($items) > 0) ? $items[0] : null;
            return ($foundItem && $foundItem->id != $item_id);
        }

        return false;
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
        $res["user_id"] = self::$user_id;
        $res["date"] = date("Y-m-d H:i:s", $res["date"]);
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
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
        if (!$item || $item->user_id !== self::$user_id) {
            throw new \Error("Item not found");
        }

        $res = $this->validateParams($params, $item_id);
        if (isset($res["date"])) {
            $res["date"] = date("Y-m-d H:i:s", $res["date"]);
        }
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
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
        }

        return true;
    }

    /**
     * Removes all reminders
     *
     * @return bool
     */
    public function reset()
    {
        if (!self::$user_id) {
            return false;
        }

        $condArr = ["user_id=" . self::$user_id];
        if (!$this->dbObj->deleteQ($this->tbl_name, $condArr)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }

    /**
     * Returns array of icons
     *
     * @param array $params array of options:
     *     - 'schedule_id' => (int) - scheduled transaction filter
     *     - 'transaction_id' => (int) - transaction filter
     *     - 'state' => (int) - reminder state filter
     *     - 'date' => (int) - exact date filter
     *     - 'returnIds' => (bool) - return array of ids instead of ReminderItem
     *
     * @return ReminderItem[]|int[]
     */
    public function getData(array $params = [])
    {
        $scheduleFilter = isset($params["schedule_id"]) ? intval($params["schedule_id"]) : null;
        $trFilter = isset($params["transaction_id"]) ? intval($params["transaction_id"]) : null;
        $stateFilter = isset($params["state"]) ? intval($params["state"]) : null;
        $dateFilter = isset($params["date"]) ? intval($params["date"]) : null;
        $returnIds = $params["returnIds"] ?? false;

        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            if (!is_null($scheduleFilter) && $item->schedule_id != $scheduleFilter) {
                continue;
            }
            if (!is_null($trFilter) && $item->transaction_id != $trFilter) {
                continue;
            }
            if (!is_null($stateFilter) && $item->state != $stateFilter) {
                continue;
            }
            if (!is_null($dateFilter) && $item->date != $dateFilter) {
                continue;
            }

            $res[] = ($returnIds) ? $item->id : $item;
        }

        return $res;
    }

    /**
     * Returns default transaction for specified reminder
     *
     * @param int $item_id item id
     *
     * @return array
     */
    public function getDefaultTransaction(int $item_id)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Invalid reminder");
        }

        $scheduleModel = ScheduledTransactionModel::getInstance();
        $schedule = $scheduleModel->getItem($item->schedule_id);
        if (!$schedule) {
            throw new \Error("Invalid schedule_id");
        }

        $res = [
            "type" => $schedule->type,
            "src_id" => $schedule->src_id,
            "dest_id" => $schedule->dest_id,
            "src_amount" => $schedule->src_amount,
            "dest_amount" => $schedule->dest_amount,
            "src_curr" => $schedule->src_curr,
            "dest_curr" => $schedule->dest_curr,
            "category_id" => $schedule->category_id,
            "date" => $item->date,
            "comment" => $schedule->comment,
        ];

        return $res;
    }

    /**
     * Changes state of reminder(s) to 'Confirmed'
     *
     * @param mixed $ids reminder id or array of ids
     * @param array $request request data
     *
     * @return bool
     */
    public function confirm(mixed $ids, array $request)
    {
        $ids = asArray($ids);
        if (count($ids) > 1 && isset($request["transaction_id"])) {
            throw new \Error(__("ERR_CONFIRM_MULTIPLE_REMINDERS_WITH_TRANSACTION"));
        }

        foreach ($ids as $item_id) {
            $item = $this->getItem($item_id);
            if (!$item) {
                throw new \Error("Invalid reminder");
            }
            if ($item->state === REMINDER_CONFIRMED) {
                throw new \Error("Reminder already confirmed");
            }

            if (isset($request["transaction_id"])) {
                $transaction_id = $request["transaction_id"];
            } else {
                $transaction = $this->getDefaultTransaction($item_id);

                $transactionModel = TransactionModel::getInstance();
                $transaction_id = $transactionModel->create($transaction);
                if (!$transaction_id) {
                    throw new \Error("Failed to create transaction");
                }
            }

            $updRes = $this->update($item_id, [
                "state" => REMINDER_CONFIRMED,
                "transaction_id" => $transaction_id,
            ]);
            if (!$updRes) {
                return false;
            }
        }

        return true;
    }

    /**
     * Changes state of reminder to 'Cancelled'
     *
     * @param mixed $ids reminder id or array of ids
     *
     * @return bool
     */
    public function cancel(mixed $ids)
    {
        $ids = asArray($ids);
        foreach ($ids as $item_id) {
            $res = $this->update($item_id, [
                "state" => REMINDER_CANCELLED,
                "transaction_id" => 0,
            ]);
            if (!$res) {
                throw new \Error("Failed to cancel reminder");
            }
        }

        return true;
    }

    /**
     * Removes all reminders of specified scheduled transaction
     *
     * @param int $schedule_id scheduled transaction id
     *
     * @return bool
     */
    public function deleteRemindersBySchedule(int $schedule_id)
    {
        $ids = $this->getData([
            "schedule_id" => $schedule_id,
            "returnIds" => true,
        ]);

        return $this->del($ids);
    }

    /**
     * Handles transaction delete event
     * Changes state of reminders to 'Scheduled'
     *
     * @param mixed $transactions id or array of transaction ids
     *
     * @return bool
     */
    public function onTransactionDelete(mixed $transactions)
    {
        if (is_null($transactions)) {
            return false;
        }

        $transactions = asArray($transactions);
        if (count($transactions) === 0) {
            return true;
        }

        $updRes = $this->dbObj->updateQ(
            $this->tbl_name,
            ["transaction_id" => 0, "state" => REMINDER_SCHEDULED],
            "transaction_id" . inSetCondition($transactions),
        );
        if (!$updRes) {
            return false;
        }

        $this->cleanCache();

        return true;
    }
}
