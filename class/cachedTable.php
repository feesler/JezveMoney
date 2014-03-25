<?php

abstract class CachedTable
{
	protected $cache = NULL;


	// Class constructor
	public function __construct()
	{
	}


	// Return link to cache of derived class
	abstract protected function &getDerivedCache();


	// Update cache
	abstract protected function updateCache();


	// Check state of cache and update if needed
	protected function checkCache()
	{
		$this->cache =& $this->getDerivedCache();

		if (is_null($this->cache))
			$this->updateCache();

		return (!is_null($this->cache));
	}


	// Return value of specified object from cache
	protected function getCache($obj_id, $val)
	{
		$obj_id = intval($obj_id);
		if (!$obj_id || !$val)
			return NULL;

		if (!$this->checkCache())
			return NULL;

		if (!isset($this->cache[$obj_id]))
			return NULL;

		return $this->cache[$obj_id][$val];
	}


	// Clean cached data. Next getCache() request will update cache
	protected function cleanCache()
	{
		$this->cache = NULL;
	}


	// Return count of objects
	public function getCount()
	{
		if (!self::checkCache())
			return 0;

		return count($this->cache);
	}


	// Check is specified object is exist
	public function is_exist($obj_id)
	{
		if (!is_numeric($obj_id))
			return FALSE;

		$obj_id = intval($obj_id);
		if (!$obj_id)
			return FALSE;

		if (!$this->checkCache())
			return FALSE;

		return isset($this->cache[$obj_id]);
	}
}

?>