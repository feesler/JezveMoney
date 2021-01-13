<?php

namespace JezveMoney\Core;

abstract class Model
{
    protected $dbObj = null;
    protected $tbl_name = null;


    abstract protected function rowToObj($row);

    abstract protected function preCreate($params, $isMultiple = false);
    // Perform model-specific actions after new item successfully created
    protected function postCreate($item_id)
    {
    }


    // Prepare data of single row for new item insert query
    private function prepareRow($params, $isMultiple = false)
    {
        if (!is_array($params)) {
            return 0;
        }

        $res = $this->preCreate($params, $isMultiple);
        if (!is_array($res)) {
            return null;
        }

        $res["id"] = null;  // overwrite id even if it is set

        return $res;
    }


    // Create new item and return id
    public function create($params)
    {
        $prepared = $this->prepareRow($params, false);
        if (!is_array($prepared)) {
            return 0;
        }
        if (!$this->dbObj->insertQ($this->tbl_name, $prepared)) {
            return 0;
        }

        $item_id = $this->dbObj->insertId();
        wlog("item_id: " . $item_id);

        $this->postCreate($item_id);

        return $item_id;
    }


    // Create multiple items
    // Return list of ids if succeeded or NULL otherwise
    public function createMultiple($params)
    {
        if (!is_array($params)) {
            return null;
        }

        $prepared = [];
        foreach ($params as $item) {
            $row = $this->prepareRow($item, true);
            if (!is_array($row)) {
                return null;
            }

            $prepared[] = $row;
        }

        $rowsPrepared = count($prepared);

        if (!$this->dbObj->insertMultipleQ($this->tbl_name, $prepared)) {
            return null;
        }
        unset($prepared);

        if ($rowsPrepared != $this->dbObj->affectedRows()) {
            wlog("Unexpected count of affected rows");
            return null;
        }

        $res = [];
        $item_id = $this->dbObj->insertId();
        while ($rowsPrepared--) {
            $res[] = $item_id++;
        }

        $this->postCreate($res);

        return $res;
    }


    // Check update conditions and return array of expressions as result
    abstract protected function preUpdate($item_id, $params);
    // Perform model-specific actions after update successfully completed
    protected function postUpdate($item_id)
    {
    }


    // Update specified item and return boolean result
    public function update($item_id, $params)
    {
        $item_id = intval($item_id);
        if (!$item_id || !is_array($params)) {
            return false;
        }

        // unset id if set
        if (isset($params["id"])) {
            unset($params["id"]);
        }

        $prepareRes = $this->preUpdate($item_id, $params);
        if (is_null($prepareRes)) {
            return false;
        }

        $updRes = $this->dbObj->updateQ($this->tbl_name, $prepareRes, "id=" . $item_id);
        if (!$updRes) {
            return 0;
        }

        $this->postUpdate($item_id);

        return true;
    }


    // Check delete conditions and return boolean result
    abstract protected function preDelete($items);
    // Perform model-specific actions after delete successfully completed
    protected function postDelete($items)
    {
    }


    // Delete specified item
    public function del($items)
    {
        $items = asArray($items);
        if (!count($items)) {
            return true;
        }

        $setCond = inSetCondition($items);
        if (is_null($setCond)) {
            return false;
        }

        $prepareRes = $this->preDelete($items);
        if (!$prepareRes) {
            return false;
        }

        $qRes = $this->dbObj->deleteQ($this->tbl_name, "id" . $setCond);
        if (!$qRes) {
            return false;
        }

        $this->postDelete($items);

        return true;
    }


    // Return currenct autoincrement value of table
    public function autoIncrement()
    {
        return $this->dbObj->getAutoIncrement($this->tbl_name);
    }
}
