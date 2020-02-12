<?php

trait CachedInstance
{
	static protected $dcache = NULL;
}


abstract class CachedTable extends Model
{
	protected $cache = NULL;


	// Return link to cache of derived class
	protected function &getDerivedCache()
	{
		return static::$dcache;
	}


	// Query data from DB and return result object
	abstract protected function dataQuery();


	// Update cache
	protected function updateCache()
	{
		$this->cache = [];

		$qResult = $this->dataQuery();
		if (!$qResult)
			return;

		while($row = $this->dbObj->fetchRow($qResult))
		{
			$obj = $this->rowToObj($row);
			if (!is_null($obj))
				$this->cache[$obj->id] = $obj;
		}
	}


	// Check state of cache and update if needed
	protected function checkCache()
	{
		$this->cache =& $this->getDerivedCache();

		if (is_null($this->cache))
			$this->updateCache();

		return (!is_null($this->cache));
	}


	// Return specified object from cache
	public function getItem($obj_id)
	{
		$obj_id = intval($obj_id);
		if (!$obj_id)
			return NULL;

		if (!$this->checkCache())
			return NULL;

		if (!isset($this->cache[$obj_id]))
			return NULL;

		return $this->cache[$obj_id];
	}


	// Clean cached data. Next access to the cache will request update of data from DB
	protected function cleanCache()
	{
		$this->cache = NULL;
	}


	// Return count of objects
	public function getCount()
	{
		if (!$this->checkCache())
			return 0;

		return count($this->cache);
	}


	// Return latest id from set of objects
	public function getLatestId()
	{
		if (!$this->checkCache())
			return 0;

		$res = 0;
		foreach($this->cache as $item_id => $itemObj)
		{
			$res = max($res, $item_id);
		}

		return $res;
	}


	// Check is specified object is exist
	public function is_exist($obj_id)
	{
		$obj_id = intval($obj_id);
		if (!$obj_id)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		return isset($this->cache[$obj_id]);
	}


	// Return id of item by specified position
	public function getIdByPos($position)
	{
		if (!$this->checkCache())
			return 0;

		$keys = array_keys($this->cache);
		if (isset($keys[$position]))
			return $keys[$position];

		return 0;
	}


	protected function postCreate($item_id)
	{
		$this->cleanCache();
	}


	protected function postUpdate($item_id)
	{
		$this->cleanCache();
	}


	protected function postDelete($item_id)
	{
		$this->cleanCache();
	}
}
