<?php

namespace JezveMoney\Core;

/**
 * Cached model class
 */
abstract class CachedTable extends Model
{
    protected $cache = null;

    /**
     * Returns link to cache of derived class
     */
    protected function &getDerivedCache()
    {
        return static::$dcache;
    }

    /**
     * Query data from DB
     *
     * @return \mysqli_result|bool
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

    /**
     * Checks state of cache and update if needed
     *
     * @return bool
     */
    protected function checkCache()
    {
        $this->cache = &$this->getDerivedCache();

        if (is_null($this->cache)) {
            $this->updateCache();
        }

        return (!is_null($this->cache));
    }

    /**
     * Return specified item from cache
     *
     * @param int $obj_id item id
     *
     * @return object|null
     */
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
     * @param int $obj_id item id
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
     * @param int $position item position
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

    /**
     * Performs final steps after new item was successfully created
     *
     * @param int|int[]|null $items id or array of created item ids
     *
     * @return bool
     */
    protected function postCreate(mixed $items)
    {
        $this->cleanCache();

        return true;
    }

    /**
     * Performs final steps after item was successfully updated
     *
     * @param int $item_id item id
     *
     * @return bool
     */
    protected function postUpdate(int $item_id)
    {
        $this->cleanCache();

        return true;
    }

    /**
     * Performs final steps after items were successfully removed
     *
     * @param int[] $items ids array of removed items
     *
     * @return bool
     */
    protected function postDelete(array $items)
    {
        $this->cleanCache();

        return true;
    }
}
