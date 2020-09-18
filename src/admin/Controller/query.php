<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\MySqlDB;


class QueryAdminController extends AdminController
{
	protected $db = NULL;
	protected $tableName = "admin_query";


	public function onStart()
	{
		$this->db = MySqlDB::getInstance();
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
				$qerr_num = $this->db->getError();
				$qerror = $this->db->getMessage();
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
