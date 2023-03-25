<?php

namespace JezveMoney\App\Model;

use JezveMoney\Core\MySqlDB;
use JezveMoney\Core\CachedTable;
use JezveMoney\Core\Singleton;
use JezveMoney\App\Item\CurrencyItem;

use function JezveMoney\Core\orJoin;

const CURRENCY_SIGN_BEFORE_VALUE = 0x01;
const CURRENCY_FORMAT_TRAILING_ZEROS = 0x02;

const MAX_PRECISION = 8;

/**
 * Currency model
 */
class CurrencyModel extends CachedTable
{
    use Singleton;

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
     * @param array|null $row array of table row fields
     *
     * @return CurrencyItem|null
     */
    protected function rowToObj(?array $row)
    {
        return CurrencyItem::fromTableRow($row);
    }

    /**
     * Returns data query object for CachedTable::updateCache()
     *
     * @return \mysqli_result|bool
     */
    protected function dataQuery()
    {
        return $this->dbObj->selectQ("*", $this->tbl_name);
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
        $avFields = ["name", "code", "sign", "flags"];
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

        if (isset($params["code"])) {
            $res["code"] = $this->dbObj->escape($params["code"]);
            if (is_empty($res["code"])) {
                throw new \Error("Invalid code specified");
            }
        }

        if (isset($params["sign"])) {
            $res["sign"] = $this->dbObj->escape($params["sign"]);
            if (is_empty($res["sign"])) {
                throw new \Error("Invalid sign specified");
            }
        }

        if (isset($params["precision"])) {
            $res["precision"] = intval($params["precision"]);
            if ($res["precision"] < 0 || $res["precision"] > MAX_PRECISION) {
                throw new \Error("Invalid precision value");
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
     * @param array $params item fields
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function isSameItemExist(array $params, int $item_id = 0)
    {
        if (!is_array($params) || !isset($params["code"])) {
            return false;
        }

        $foundItem = $this->findByCode($params["code"]);
        return ($foundItem && $foundItem->id != $item_id);
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
        if (!$item) {
            throw new \Error("Item not found");
        }

        $res = $this->validateParams($params, $item_id);
        $res["updatedate"] = date("Y-m-d H:i:s");

        return $res;
    }

    /**
     * Returns true if currency is in use by other models
     *
     * @param int $item_id currency id
     *
     * @return bool
     */
    public function isInUse(int $item_id)
    {
        $item_id = intval($item_id);
        if (!$item_id) {
            return false;
        }

        $qResult = $this->dbObj->selectQ("id", "account", "curr_id=" . $item_id);
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        $qResult = $this->dbObj->selectQ(
            "id",
            "transactions",
            orJoin(["src_curr=" . $item_id, "dest_curr=" . $item_id])
        );
        if ($this->dbObj->rowsCount($qResult) > 0) {
            return true;
        }

        return false;
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

    /**
     * Returns value formatted with specified currency
     *
     * @param float $value value to format
     * @param int $curr_id currency id
     *
     * @return string|null
     */
    public function format(float $value, int $curr_id)
    {
        $currObj = $this->getItem($curr_id);
        if (!$currObj) {
            return null;
        }

        $signBeforeValue = ($currObj->flags & CURRENCY_SIGN_BEFORE_VALUE) === CURRENCY_SIGN_BEFORE_VALUE;
        $trailingZeros = ($currObj->flags & CURRENCY_FORMAT_TRAILING_ZEROS) === CURRENCY_FORMAT_TRAILING_ZEROS;

        $valueFmt = valFormat($value, $currObj->precision, $trailingZeros);

        return ($signBeforeValue)
            ? ($currObj->sign . " " . $valueFmt)
            : ($valueFmt . " " . $currObj->sign);
    }

    /**
     * Returns array of currencies
     *
     * @param array $options data filter options
     *
     * @return CurrencyItem[]
     */
    public function getData(array $options = [])
    {
        $res = [];

        if (!$this->checkCache()) {
            return $res;
        }

        foreach ($this->cache as $item) {
            $res[] = $item;
        }

        return $res;
    }

    /**
     * Search for currency with specified name
     *
     * @param string $name name of currency to find
     * @param bool $caseSens case sensitive flag
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
     * Search for currency with specified code
     *
     * @param string $code code of currency to find
     *
     * @return object|null
     */
    public function findByCode(string $code)
    {
        if (is_empty($code)) {
            return null;
        }

        if (!$this->checkCache()) {
            return null;
        }

        $code = strtolower($code);
        foreach ($this->cache as $item) {
            if (strtolower($item->code) == $code) {
                return $item;
            }
        }

        return null;
    }
}
