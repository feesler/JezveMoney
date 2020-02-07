<?php

abstract class Model
{
	protected $dbObj = NULL;
	protected $tbl_name = NULL;


	abstract protected function preCreate($params, $isMultiple = FALSE);
	// Perform model-specific actions after new item successfully created
	protected function postCreate($item_id){}


	// Prepare data of single row for new item insert query
	private function prepareRow($params, $isMultiple = FALSE)
	{
		if (!is_array($params))
			return 0;

		$res = $this->preCreate($params, $isMultiple);
		if (!is_array($res))
			return NULL;

		$res["id"] = NULL;	// overwrite id even if it is set

		return $res;
	}


	// Create new item and return id
	public function create($params)
	{
		$prepared = $this->prepareRow($params, FALSE);
		if (!is_array($prepared))
			return 0;
		if (!$this->dbObj->insertQ($this->tbl_name, $prepared))
			return 0;

		$item_id = $this->dbObj->insertId();
		wlog("item_id: ".$item_id);

		$this->postCreate($item_id);

		return $item_id;
	}


	// Create multiple items
	// Return list of ids if succeeded or NULL otherwise
	public function createMultiple($params)
	{
		if (!is_array($params))
			return NULL;

		$prepared = [];
		foreach($params as $item)
		{
			$row = $this->prepareRow($item, TRUE);
			if (!is_array($row))
				return NULL;

			$prepared[] = $row;
		}

		$rowsPrepared = count($prepared);

		if (!$this->dbObj->insertMultipleQ($this->tbl_name, $prepared))
			return NULL;
		unset($prepared);

		if ($rowsPrepared != $this->dbObj->affected)
		{
			wlog("Unexpected count of affected rows");
			return NULL;
		}

		$res = [];
		$item_id = $this->dbObj->insert_id;
		while($rowsPrepared--)
		{
			$res[] = $item_id++;
		}

		$this->postCreate($res);

		return $res;
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
	abstract protected function preDelete($items);
	// Perform model-specific actions after delete successfully completed
	protected function postDelete($items){}


	// Delete specified item
	public function del($items)
	{
		if (!is_array($items))
			$items = [ $items ];
		if (!count($items))
			return TRUE;

		$setCond = inSetCondition($items);
		if (is_null($setCond))
			return FALSE;

		$prepareRes = $this->preDelete($items);
		if (!$prepareRes)
			return FALSE;

		$qRes = $this->dbObj->deleteQ($this->tbl_name, "id".$setCond);
		if (!$qRes)
		    return FALSE;

		$this->postDelete($items);

		return TRUE;
	}
}
