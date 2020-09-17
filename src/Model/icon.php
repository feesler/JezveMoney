<?php


class IconModel extends CachedTable
{
	use Singleton;
	use CachedInstance;

	protected $tbl_name = "icon";
	protected $availTypes = [ ICON_TILE => "Tile icon" ];


	protected function onStart()
	{
		$this->dbObj = MySqlDB::getInstance();
	}


	// Convert DB row to item object
	protected function rowToObj($row)
	{
		if (is_null($row))
			return NULL;

		$res = new stdClass;
		$res->id = intval($row["id"]);
		$res->name = $row["name"];
		$res->file = $row["file"];
		$res->type = intval($row["type"]);
		$res->createdate = strtotime($row["createdate"]);
		$res->updatedate = strtotime($row["updatedate"]);

		return $res;
	}


	// Called from CachedTable::updateCache() and return data query object
	protected function dataQuery()
	{
		return $this->dbObj->selectQ("*", $this->tbl_name);
	}


	protected function checkParams($params, $isUpdate = FALSE)
	{
		$avFields = ["name", "file", "type"];
		$res = [];

		// In CREATE mode all fields is required
		if (!$isUpdate && !checkFields($params, $avFields))
			return NULL;

		if (isset($params["name"]))
		{
			$res["name"] = $this->dbObj->escape($params["name"]);
			if (is_empty($res["name"]))
			{
				wlog("Invalid name specified");
				return NULL;
			}
		}

		if (isset($params["file"]))
		{
			$res["file"] = $this->dbObj->escape($params["file"]);
			if (is_empty($res["file"]))
			{
				wlog("Invalid file specified");
				return NULL;
			}
		}

		if (isset($params["type"]))
			$res["type"] = intval($params["type"]);

		return $res;
	}


	// Preparations for item create
	protected function preCreate($params, $isMultiple = FALSE)
	{
		$res = $this->checkParams($params);
		if (is_null($res))
			return NULL;

		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, [ "type=".qnull($res["type"]), "file=".qnull($res["file"]) ]);
		if ($this->dbObj->rowsCount($qResult) > 0)
		{
			wlog("Such item already exist");
			return NULL;
		}

		$res["createdate"] = $res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	// Preparations for item update
	protected function preUpdate($item_id, $params)
	{
		// check currency is exist
		$currObj = $this->getItem($item_id);
		if (!$currObj)
			return FALSE;

		$res = $this->checkParams($params, TRUE);
		if (is_null($res))
			return NULL;

		$qResult = $this->dbObj->selectQ("*", $this->tbl_name, [ "type=".qnull($res["type"]), "file=".qnull($res["file"]) ]);
		$row = $this->dbObj->fetchRow($qResult);
		if ($row)
		{
			$found_id = intval($row["id"]);
			if ($found_id != $item_id)
			{
				wlog("Such item already exist");
				return NULL;
			}
		}

		$res["updatedate"] = date("Y-m-d H:i:s");

		return $res;
	}


	// Check currency is in use
	public function isInUse($curr_id)
	{
		$curr_id = intval($curr_id);
		if (!$curr_id)
			return FALSE;

		$qResult = $this->dbObj->selectQ("id", "account", "icon_id=".$curr_id);
		if ($this->dbObj->rowsCount($qResult) > 0)
			return TRUE;

		return FALSE;
	}


	// Preparations for item delete
	protected function preDelete($items)
	{
		foreach($items as $item_id)
		{
			// check item is exist
			$itemObj = $this->getItem($item_id);
			if (!$itemObj)
				return FALSE;

			// don't delete items in use
			if ($this->isInUse($item_id))
				return FALSE;
		}

		return TRUE;
	}


	// Return array of items
	public function getData()
	{
		$res = [];

		if (!$this->checkCache())
			return $res;

		foreach($this->cache as $item)
		{
			$itemObj = new stdClass;

			$itemObj->id = $item->id;
			$itemObj->name = $item->name;
			$itemObj->file = $item->file;
			$itemObj->type = $item->type;

			$res[] = $itemObj;
		}

		return $res;
	}


	// Return array of available types
	public function getTypes()
	{
		$res = [];
		foreach($this->availTypes as $type_id => $typeName)
		{
			$res[$type_id] = $typeName;
		}

		return $res;
	}
}
