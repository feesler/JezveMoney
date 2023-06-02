<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\IntervalOffsetItem;

/**
 * Scheduled transaction interval offset models
 */
class IntervalOffsetModel extends CachedTable
{
    use Singleton;

    private static $user_id = 0;

    protected $tbl_name = "interval_offset";
    protected $scheduleModel = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->scheduleModel = ScheduledTransactionModel::getInstance();

        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return IntervalOffsetItem|null
     */
    protected function rowToObj(?array $row)
    {
        return IntervalOffsetItem::fromTableRow($row);
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
        $avFields = ["schedule_id", "month_offset", "day_offset"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }
        $item = ($item_id) ? $this->getItem($item_id) : null;

        if (isset($params["schedule_id"])) {
            $res["schedule_id"] = intval($params["schedule_id"]);
            if (!$this->scheduleModel->isExist($res["schedule_id"])) {
                throw new \Error("Invalid schedule_id specified");
            }
        } else {
            $res["schedule_id"] = $item->schedule_id;
        }

        if (isset($params["month_offset"])) {
            $res["month_offset"] = intval($params["month_offset"]);
        } else {
            $res["month_offset"] = $item->month_offset;
        }

        if (isset($params["day_offset"])) {
            $res["day_offset"] = intval($params["day_offset"]);
        } else {
            $res["day_offset"] = $item->day_offset;
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same entry already exist");
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
        if (
            !is_array($params)
            || !isset($params["schedule_id"])
            || !isset($params["month_offset"])
            || !isset($params["day_offset"])
        ) {
            return false;
        }

        $items = $this->getData($params);
        $foundItem = (count($items) > 0)  ? $items[0] : null;
        return ($foundItem && $foundItem->id != $item_id);
    }

    /**
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params item fields
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $res = $this->validateParams($params);

        $res["user_id"] = self::$user_id;

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
        if (!$item) {
            throw new \Error("Item not found");
        }
        if ($item->user_id != self::$user_id) {
            throw new \Error("Invalid user");
        }

        $res = $this->validateParams($params, $item_id);

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
            $item = $this->getItem($item_id);
            if (!$item) {
                return false;
            }

            // check user
            if ($item->user_id != self::$user_id) {
                return false;
            }
        }

        return true;
    }

    /**
     * Removes all interval offset items of user
     *
     * @return bool
     */
    public function reset()
    {
        if (!$this->checkCache()) {
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
     * Returns array of interval offset items
     *
     * @param array $params options array:
     *     - 'schedule_id' => (int) - parent scheduled transaction filter
     *     - 'month_offset' => (int) - month offset filter
     *     - 'day_offset' => (int) - day offset filter
     *     - 'returnIds' => (bool) - return array of ids instead of ReminderItem
     *
     * @return IntervalOffsetItem[]|int[]
     */
    public function getData(array $params = [])
    {
        if (!$this->checkCache()) {
            return [];
        }

        $scheduleFilter = isset($params["schedule_id"]) ? intval($params["schedule_id"]) : null;
        $monthFilter = isset($params["month_offset"]) ? intval($params["month_offset"]) : null;
        $dayFilter = isset($params["day_offset"]) ? intval($params["day_offset"]) : null;
        $returnIds = $params["returnIds"] ?? false;

        $res = [];
        foreach ($this->cache as $item) {
            if (!is_null($scheduleFilter) && $item->schedule_id != $scheduleFilter) {
                continue;
            }
            if (!is_null($monthFilter) && $item->month_offset != $monthFilter) {
                continue;
            }
            if (!is_null($dayFilter) && $item->day_offset != $dayFilter) {
                continue;
            }

            $res[] = ($returnIds) ? $item->id : $item;
        }

        return $res;
    }

    /**
     * Returns array of interval offsets for specified item
     *
     * @param int $schedule_id parent scheduled transaction id
     *
     * @return int[]
     */
    public function getOffsetsBySchedule(int $schedule_id)
    {
        $items = $this->getData(["schedule_id" => $schedule_id]);

        $res = [];
        foreach ($items as $item) {
            $offset = ($item->month_offset * 100) + $item->day_offset;
            $res[] = $offset;
        }

        return $res;
    }

    /**
     * Removes all interval offsets of specified scheduled transaction
     *
     * @param int $schedule_id scheduled transaction id
     *
     * @return bool
     */
    public function deleteOffsetsBySchedule(int $schedule_id)
    {
        $ids = $this->getData([
            "schedule_id" => $schedule_id,
            "returnIds" => true,
        ]);

        return $this->del($ids);
    }
}
