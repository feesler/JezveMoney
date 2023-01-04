<?php

namespace JezveMoney\Core;

abstract class CachedTable extends Model
{
    protected $cache = null;


    // Return link to cache of derived class
    protected function &getDerivedCache()
    {
        return static::$dcache;
    }

    /**
     * Query data from DB
     *
     * @return mysqli_result|bool
     */
    abstract protected function dataQuery();

    /**
     * Updates cache
     */
    protected function updateCache()
    {
        $this->cache = [];

        $qResult = $this->dataQuery();
        if (!$qResult) {
            return;
        }

        while ($row = $this->dbObj->fetchRow($qResult)) {
            $obj = $this->rowToObj($row);
            if (!is_null($obj)) {
                $this->cache[$obj->id] = $obj;
            }
        }
    }


    // Check state of cache and update if needed
    protected function checkCache()
    {
        $this->cache = &$this->getDerivedCache();

        if (is_null($this->cache)) {
            $this->updateCache();
        }

        return (!is_null($this->cache));
    }


    // Return specified object from cache
    public function getItem(int $obj_id)
    {
        $obj_id = intval($obj_id);
        if (!$obj_id) {
            return null;
        }

        if (!$this->checkCache()) {
            return null;
        }

        if (!isset($this->cache[$obj_id])) {
            return null;
        }

        return $this->cache[$obj_id];
    }

    /**
     * Cleans cache. Next access to the cache will request update of data from DB
     */
    protected function cleanCache()
    {
        $this->cache = null;
    }

    /**
     * Returns count of items in the cache
     *
     * @return int
     */
    public function getCount()
    {
        if (!$this->checkCache()) {
            return 0;
        }

        return count($this->cache);
    }

    /**
     * Returns latest id from of items in the cache
     *
     * @return int
     */
    public function getLatestId()
    {
        if (!$this->checkCache()) {
            return 0;
        }

        $res = 0;
        foreach ($this->cache as $item_id => $itemObj) {
            $res = max($res, $item_id);
        }

        return $res;
    }

    /**
     * Returns true if specified item is exist
     *
     * @param int $obj_id - item id
     *
     * @return bool
     */
    public function isExist(int $obj_id)
    {
        $obj_id = intval($obj_id);
        if (!$obj_id) {
            return false;
        }

        if (!$this->checkCache()) {
            return false;
        }

        return isset($this->cache[$obj_id]);
    }

    /**
     * Returns id of item at specified position
     *
     * @param int $position
     *
     * @return int
     */
    public function getIdByPos(int $position)
    {
        if (!$this->checkCache()) {
            return 0;
        }

        $keys = array_keys($this->cache);
        if (isset($keys[$position])) {
            return $keys[$position];
        }

        return 0;
    }


    protected function postCreate(mixed $item_id)
    {
        $this->cleanCache();
    }


    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();
    }


    protected function postDelete(array $item_id)
    {
        $this->cleanCache();
    }
}
