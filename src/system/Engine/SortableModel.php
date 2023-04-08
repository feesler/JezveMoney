<?php

namespace JezveMoney\Core;

/**
 * Sortable model
 */
abstract class SortableModel extends CachedTable
{
    protected $latestPos = null;
    protected static $user_id = 0;
    protected static $owner_id = 0;

    /**
     * Returns affected item if needed
     *
     * @param mixed $item item object
     *
     * @return array|object|null
     */
    protected function getAffected(mixed $item)
    {
        return $item;
    }

    /**
     * Returns next position for new item
     *
     * @return int
     */
    protected function getNextPos()
    {
        if (is_null($this->latestPos)) {
            $this->latestPos = $this->getLatestPos();
        }
        $this->latestPos++;

        return $this->latestPos;
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
        $this->latestPos = null;

        return true;
    }

    /**
     * Checks item with specified position is exists
     *
     * @param int $position position
     *
     * @return bool
     */
    public function isPosExist(int $position)
    {
        $pos = intval($position);

        if (!$this->checkCache()) {
            return false;
        }

        foreach ($this->cache as $item) {
            $converted = $this->getAffected($item);
            if ($converted->pos == $pos) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns latest position of accounts
     *
     * @return int
     */
    public function getLatestPos()
    {
        if (!$this->checkCache()) {
            return 0;
        }

        $res = 0;
        foreach ($this->cache as $item) {
            $converted = $this->getAffected($item);
            $res = max($converted->pos, $res);
        }

        return $res;
    }

    /**
     * Updates position of item
     *
     * @param array $request
     *
     * @return bool
     */
    public function updatePosition(array $request)
    {
        $changePosFields = ["id", "pos"];
        checkFields($request, $changePosFields, true);

        $item_id = intval($request["id"]);
        $new_pos = intval($request["pos"]);
        if (!$item_id || !$new_pos) {
            return false;
        }

        $item = $this->getItem($item_id);
        if (!$item || $item->user_id != self::$user_id) {
            return false;
        }

        $old_pos = $item->pos;
        if ($old_pos == $new_pos) {
            return true;
        }

        if ($this->isPosExist($new_pos)) {
            $updRes = false;
            if ($old_pos == 0) {           // insert with specified position
                $updRes = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos+1"],
                    ["user_id=" . self::$user_id, "pos >= $new_pos"],
                );
            } elseif ($new_pos < $old_pos) {       // moving up
                $updRes = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos+1"],
                    ["user_id=" . self::$user_id, "pos >= $new_pos", "pos < $old_pos"],
                );
            } elseif ($new_pos > $old_pos) {        // moving down
                $updRes = $this->dbObj->updateQ(
                    $this->tbl_name,
                    ["pos=pos-1"],
                    ["user_id=" . self::$user_id, "pos > $old_pos", "pos <= $new_pos"],
                );
            }
            if (!$updRes) {
                return false;
            }
        }

        if (!$this->dbObj->updateQ($this->tbl_name, ["pos" => $new_pos], "id=" . $item_id)) {
            return false;
        }

        $this->cleanCache();

        return true;
    }
}
