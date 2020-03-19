<?php

class QueryAdminController extends AdminController
{
	public function onStart()
	{
		$this->tableName = "admin_query";

		$this->db = mysqlDB::getInstance();
		if (!$this->db->isTableExist($this->tableName))
			$this->createTable();
	}


	public function index()
	{
		$query = NULL;
		$cols = 0;
		$rows = 0;
		if (isset($_POST["query"]) && $_POST["query"] != "")
		{
			$query = $_POST["query"];

			if (isset($_POST["qtype"]) && $_POST["qtype"] == "1")		// select query
			{
				$resArr = [];
				$result = $this->db->rawQ($query);
				$qerr_num = $this->db->errno;
				$qerror = $this->db->errorMessage;
				if ($result && $result !== TRUE && !is_null($result) && !$qerr_num && $this->db->rowsCount($result) > 0)
				{
					$this->saveQuery($query);

					while($row = $this->db->fetchRow($result))
						$resArr[] = $row;

					$rows = count($resArr);
					$cols = isset($resArr[0]) ? count($resArr[0]) : 0;
				}
			}
		}

		$latestQueries = $this->getLatestQueries();

		$this->menuItems["query"]["active"] = TRUE;

		$titleString = "Admin panel | DB queries";

		$this->cssAdmin[] = "query.css";
		$this->buildCSS();

		include(ADMIN_TPL_PATH."query.tpl");
	}


	protected function createTable()
	{
		$res = $this->db->createTableQ($this->tableName,
						"`id` INT(11) NOT NULL AUTO_INCREMENT, ".
						"`title` VARCHAR(255) NOT NULL, ".
						"`query` TEXT NOT NULL, ".
						"`flags` INT(11) NOT NULL DEFAULT '0', ".
						"PRIMARY KEY (`id`)",
						"DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_general_ci");

		return $res;
	}


	protected function saveQuery($query)
	{
		if (!is_string($query) || is_empty($query))
			return;

		$latestQueries = $this->getLatestQueries(1);
		if (count($latestQueries) == 1 && $latestQueries[0] == $query)
			return;

		$escapedQuery = $this->db->escape($query);

		$this->db->insertQ($this->tableName, [
			"id" => NULL,
			"title" => "",
			"query" => $escapedQuery,
			"flags" => 0
		]);
	}


	protected function getLatestQueries($limit = 10)
	{
		$limit = intval($limit);

		$res = [];
		$qResult = $this->db->selectQ("query", $this->tableName, NULL, NULL, "id DESC LIMIT $limit");
		while($row = $this->db->fetchRow($qResult))
			$res[] = $row["query"];

		return $res;
	}
}
