<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\SortableModel;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\UserCurrrencyItem;

/**
 * User currency model
 */
class UserCurrencyModel extends SortableModel
{
    use Singleton;

    protected $tbl_name = "user_currency";
    protected $currencyModel = null;

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $uMod = UserModel::getInstance();
        self::$user_id = $uMod->getUser();

        $this->currencyModel = CurrencyModel::getInstance();

        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array|null $row array of table row fields
     *
     * @return UserCurrrencyItem|null
     */
    protected function rowToObj(?array $row)
    {
        return UserCurrrencyItem::fromTableRow($row);
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
        $avFields = ["curr_id", "flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["curr_id"])) {
            $res["curr_id"] = intval($params["curr_id"]);
            if (!$this->currencyModel->isExist($res["curr_id"])) {
                throw new \Error("Invalid curr_id specified");
            }
        }

        if (isset($params["pos"])) {
            $res["pos"] = intval($params["pos"]);
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
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
        if (!is_array($params) || !isset($params["curr_id"])) {
            return false;
        }

        $items = $this->getData(["curr_id" => $params["curr_id"]]);
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

        $res["pos"] = $this->getNextPos();
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");
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
     * Removes all currencies of user
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
     * Returns array of user currencies
     *
     * @param array $params options array:
     *     - 'curr_id' => (int) - currency filter
     *
     * @return UserCurrrencyItem[]
     */
    public function getData(array $params = [])
    {
        if (!$this->checkCache()) {
            return [];
        }

        $currencyFilter = isset($params["curr_id"]) ? intval($params["curr_id"]) : null;

        $res = [];
        foreach ($this->cache as $item) {
            if (!is_null($currencyFilter) && $item->curr_id != $currencyFilter) {
                continue;
            }

            $res[] = clone $item;
        }

        return $res;
    }
}
