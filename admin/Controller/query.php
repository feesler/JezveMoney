<?php

class QueryAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$db = mysqlDB::getInstance();

		$query = NULL;
		if (isset($_POST["query"]) && $_POST["query"] != "")
		{
			$query = $_POST["query"];

			if (isset($_POST["qtype"]) && $_POST["qtype"] == "1")		// select query
			{
				$resArr = array();
				$result = $db->rawQ($query);
				$qerr_num = mysqli_errno($db->getConnection());
				$qerror = mysqli_error($db->getConnection());
				if ($result && !$qerr_num && mysqli_num_rows($result) > 0)
				{
					while($row = mysqli_fetch_array($result, MYSQLI_ASSOC))
						$resArr[] = $row;

					$rows = count($resArr);
					$cols = isset($resArr[0]) ? count($resArr[0]) : 0;
				}
			}
		}

		$menuItems["query"]["active"] = TRUE;

		$titleString = "Admin panel | DB queries";

		$this->buildCSS();

		include("./view/templates/query.tpl");
	}
}
