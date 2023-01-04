<?php

namespace JezveMoney\Core;

/**
 * Base model class
 */
abstract class Model
{
    protected $dbObj = null;
    protected $tbl_name = null;
    protected $useTransactions = true;

    /**
     * Starts transaction
     *
     * @return bool
     */
    public static function begin()
    {
        $dbInstance = MySqlDB::getInstance();
        return $dbInstance->startTransaction();
    }

    /**
     * Commits current transaction
     *
     * @return bool
     */
    public static function commit()
    {
        $dbInstance = MySqlDB::getInstance();
        return $dbInstance->commitTransaction();
    }

    /**
     * Rolls back current transaction
     *
     * @return bool
     */
    public static function rollback()
    {
        $dbInstance = MySqlDB::getInstance();
        return $dbInstance->rollbackTransaction();
    }

    /**
     * Converts table row from database to object
     *
     * @param array $row
     *
     * @return object|null
     */
    abstract protected function rowToObj(array $row);

    /**
     * Checks item create conditions and returns array of expressions
     *
     * @param array $params - item fields
     * @param bool $isMultiple - flag for multiple create
     *
     * @return array|null
     */
    abstract protected function preCreate(array $params, bool $isMultiple = false);

    /**
     * Performs model-specific actions after new item successfully created
     *
     * @param array|int $item_id - item id
     */
    protected function postCreate(mixed $item_id)
    {
    }

    /**
     * Prepares data of single row for new item insert query
     *
     * @param array $params - item fields
     * @param bool $isMultiple - flag for multiple create
     *
     * @return array|null
     */
    private function prepareRow(array $params, bool $isMultiple = false)
    {
        if (!is_array($params)) {
            return null;
        }

        $res = $this->preCreate($params, $isMultiple);
        if (!is_array($res)) {
            return null;
        }

        $res["id"] = null;  // overwrite id even if it is set

        return $res;
    }

    /**
     * Creates new item and returns id
     *
     * @param array $params - item data
     *
     * @return int
     */
    public function create(array $params)
    {
        $prepared = $this->prepareRow($params, false);
        if (!is_array($prepared)) {
            throw new \Error("prepareRow failed");
        }
        if (!$this->dbObj->insertQ($this->tbl_name, $prepared)) {
            throw new \Error("insertQ failed");
        }

        $item_id = $this->dbObj->insertId();
        wlog("item_id: " . $item_id);

        $this->postCreate($item_id);

        return $item_id;
    }

    /**
     * Creates multiple items and returns array of ids
     *
     * @param array $params - array of items to create
     *
     * @return array[int]
     */
    public function createMultiple(array $params)
    {
        if (!is_array($params)) {
            throw new \Error("Invalid params");
        }

        $prepared = [];
        foreach ($params as $item) {
            $row = $this->prepareRow($item, true);
            if (!is_array($row)) {
                throw new \Error("prepareRow failed");
            }

            $prepared[] = $row;
        }

        $rowsPrepared = count($prepared);

        if (!$this->dbObj->insertMultipleQ($this->tbl_name, $prepared)) {
            throw new \Error("insertMultipleQ failed");
        }
        unset($prepared);

        if ($rowsPrepared != $this->dbObj->affectedRows()) {
            throw new \Error("Unexpected count of affected rows");
        }

        $res = [];
        $item_id = $this->dbObj->insertId();
        while ($rowsPrepared--) {
            $res[] = $item_id++;
        }

        $this->postCreate($res);

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
    abstract protected function preUpdate(int $item_id, array $params);

    /**
     * Performs model-specific actions after update successfully completed
     *
     * @param int $item_id - item id
     *
     * @return [type]
     */
    protected function postUpdate(int $item_id)
    {
    }

    /**
     * Updates specified item and returns bool result
     *
     * @param int $item_id - item id
     * @param array $params - item fields
     *
     * @return bool
     */
    public function update(int $item_id, array $params)
    {
        $item_id = intval($item_id);
        if (!$item_id || !is_array($params)) {
            throw new \Error("Invalid params");
        }

        // unset id if set
        if (isset($params["id"])) {
            unset($params["id"]);
        }

        $prepareRes = $this->preUpdate($item_id, $params);
        if (!is_array($prepareRes)) {
            throw new \Error("preUpdate failed");
        }

        $updRes = $this->dbObj->updateQ($this->tbl_name, $prepareRes, "id=" . $item_id);
        if (!$updRes) {
            throw new \Error("updateQ failed");
        }

        $this->postUpdate($item_id);

        return true;
    }

    /**
     * Checks delete conditions and returns bool result
     *
     * @param array $items - array of item ids to remove
     *
     * @return bool
     */
    abstract protected function preDelete(array $items);

    /**
     * Performs model-specific actions after delete successfully completed
     *
     * @param array $items - ids array of removed items
     */
    protected function postDelete(array $items)
    {
    }

    /**
     * Removes specified item(s)
     *
     * @param array $items - id or array of item ids to remove
     *
     * @return bool
     */
    public function del(mixed $items)
    {
        $items = asArray($items);
        if (!count($items)) {
            return true;
        }

        $setCond = inSetCondition($items);
        if (is_null($setCond)) {
            throw new \Error("Invalid parameters");
        }

        $prepareRes = $this->preDelete($items);
        if (!$prepareRes) {
            throw new \Error("preDelete failed");
        }

        $qRes = $this->dbObj->deleteQ($this->tbl_name, "id" . $setCond);
        if (!$qRes) {
            throw new \Error("deleteQ failed");
        }

        $this->postDelete($items);

        return true;
    }

    /**
     * Returns current autoincrement value of table
     *
     * @return int
     */
    public function autoIncrement()
    {
        return $this->dbObj->getAutoIncrement($this->tbl_name);
    }
}
