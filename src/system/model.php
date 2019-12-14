<?php

abstract class Model
{
	protected $dbObj = NULL;
	protected $tbl_name = NULL;


	abstract protected function preCreate($params);
	// Perform model-specific actions after new item successfully created
	protected function postCreate($item_id){}


	// Create new item and return id
	public function create($params)
	{
		if (!is_array($params))
			return 0;

		$prepareRes = $this->preCreate($params);
		if (is_null($prepareRes))
			return 0;

		$prepareRes["id"] = NULL;	// overwrite id even if it is set

		if (!$this->dbObj->insertQ($this->tbl_name, $prepareRes))
			return 0;

		$item_id = $this->dbObj->insertId();
		wlog("item_id: ".$item_id);

		$this->postCreate($item_id);

		return $item_id;
	}


	// Check update conditions and return array of expressions as result
	abstract protected function preUpdate($item_id, $params);
	// Perform model-specific actions after update successfully completed
	protected function postUpdate($item_id){}


	// Update specified item and return boolean result
	public function update($item_id, $params)
	{
		$item_id = intval($item_id);
		if (!$item_id || !is_array($params))
			return FALSE;

		// unset id if set
		if (isset($params["id"]))
			unset($params["id"]);

		$prepareRes = $this->preUpdate($item_id, $params);
		if (is_null($prepareRes))
			return FALSE;

		$updRes = $this->dbObj->updateQ($this->tbl_name, $prepareRes, "id=".$item_id);
		if (!$updRes)
			return 0;

		$this->postUpdate($item_id);

		return TRUE;
	}


	// Check delete conditions and return boolean result
	abstract protected function preDelete($item_id);
	// Perform model-specific actions after delete successfully completed
	protected function postDelete($item_id){}


	// Return right part of query condition to check field equal id or in set of ids
	// Zero values are omitted. In case no valid values found NULL is returned
	public function inSetCondition($ids)
	{
		if (is_null($ids))
			return NULL;

		$validIds = skipZeros($ids);
		if (!count($validIds))
			return NULL;

		return (count($validIds) == 1) ? "=".$validIds[0] : " IN (".implode(",", $validIds).")";
	}


	// Delete specified item
	public function del($item_id)
	{
		$item_id = intval($item_id);
		if (!$item_id)
			return FALSE;

		$prepareRes = $this->preDelete($item_id);
		if (!$prepareRes)
			return FALSE;

		$qRes = $this->dbObj->deleteQ($this->tbl_name, "id=".$item_id);
		if (!$qRes)
		    return FALSE;

		$this->postDelete($item_id);

		return TRUE;
	}
}
