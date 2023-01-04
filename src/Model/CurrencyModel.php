<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\Core\CachedInstance;
use JezveMoney\App\Item\CurrencyItem;

use function JezveMoney\Core\orJoin;

/**
 * Currency model
 */
class CurrencyModel extends CachedTable
{
    use Singleton;
    use CachedInstance;

    protected $tbl_name = "currency";

    /**
     * Model initialization
     */
    protected function onStart()
    {
        $this->dbObj = MySqlDB::getInstance();
    }

    /**
     * Converts table row from database to object
     *
     * @param array $row - array of table row fields
     *
     * @return object|null
     */
    protected function rowToObj(array $row)
    {
        if (is_null($row)) {
            return null;
        }

        $res = new \stdClass();
        $res->id = intval($row["id"]);
        $res->name = $row["name"];
        $res->sign = $row["sign"];
        $res->flags = intval($row["flags"]);
        $res->createdate = strtotime($row["createdate"]);
        $res->updatedate = strtotime($row["updatedate"]);

        return $res;
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name);
    }

    /**
     * Validates item fields before to send create/update request to database
     *
     * @param array $params - item fields
     * @param int $item_id - item id
     *
     * @return array
     */
    protected function validateParams(array $params, int $item_id = 0)
    {
        $avFields = ["name", "sign", "flags"];
        $res = [];

        // In CREATE mode all fields is required
        if (!$item_id) {
            checkFields($params, $avFields, true);
        }

        if (isset($params["name"])) {
            $res["name"] = $this->dbObj->escape($params["name"]);
            if (is_empty($res["name"])) {
                throw new \Error("Invalid name specified");
            }
        }

        if (isset($params["sign"])) {
            $res["sign"] = $this->dbObj->escape($params["sign"]);
            if (is_empty($res["sign"])) {
                throw new \Error("Invalid sign specified");
            }
        }

        if (isset($params["flags"])) {
            $res["flags"] = intval($params["flags"]);
        }

        if ($this->isSameItemExist($res, $item_id)) {
            throw new \Error("Same currency already exist");
        }

        return $res;
    }

    /**
     * Checks same item already exist
     *
     * @param array $params - item fields
     * @param int $item_id - item id
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
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params - item fields
     * @param bool $isMultiple - flag for multiple create
     *
     * @return array|null
     */
    protected function preCreate(array $params, bool $isMultiple = false)
    {
        $res = $this->validateParams($params);
        $res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Checks update conditions and returns array of expressions
     *
     * @param int $item_id - item id
     * @param array $params - item fields
     *
     * @return array
     */
    protected function preUpdate(int $item_id, array $params)
    {
        $item = $this->getItem($item_id);
        if (!$item) {
            throw new \Error("Item not found");
        }

        $res = $this->validateParams($params, $item_id);
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }


    // Check currency is in use
    public function isInUse(int $curr_id)
    {
        $curr_id = intval($curr_id);
        if (!$curr_id) {
            return false;
        }

        $qResult = $this->dbObj->selectQ("id", "account", "curr_id=" . $curr_id);
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        $qResult = $this->dbObj->selectQ(
            "id",
            "transactions",
            orJoin(["src_curr=" . $curr_id, "dest_curr=" . $curr_id])
        );
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        return false;
    }

    /**
     * Checks delete conditions and returns bool result
     *
     * @param array $items - array of item ids to remove
     *
     * @return bool
     */
    protected function preDelete(array $items)
    {
        foreach ($items as $item_id) {
            // check currency is exist
            $currObj = $this->getItem($item_id);
            if (!$currObj) {
                return false;
            }

            // don't delete currencies in use
            if ($this->isInUse($item_id)) {
                return false;
            }
        }

        return true;
    }


    // Format value in specified currency
    public function format($value, int $curr_id)
    {
        $currObj = $this->getItem($curr_id);
        if (!$currObj) {
            return null;
        }

        $sfmt = (($currObj->flags) ? ($currObj->sign . " %s") : ("%s " . $currObj->sign));
        return valFormat($sfmt, $value);
    }

    /**
     * Returns array of currencies
     *
     * @return array
     */
    public function getData()
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            $currObj = new CurrencyItem($item);
            $res[] = $currObj;
        }

        return $res;
    }

    /**
     * Searches for currency with specified name
     *
     * @param string $name - name of currency to find
     * @param bool $caseSens - case sensitive flag
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
}
