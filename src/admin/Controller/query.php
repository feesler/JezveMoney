<?php

class QueryAdminController extends AdminController
{
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
				$db = mysqlDB::getInstance();

				$resArr = [];
				$result = $db->rawQ($query);
				$qerr_num = mysqli_errno($db->getConnection());
				$qerror = mysqli_error($db->getConnection());
				if ($result && $result !== TRUE && !is_null($result) && !$qerr_num && mysqli_num_rows($result) > 0)
				{
					while($row = $db->fetchRow($result))
						$resArr[] = $row;

					$rows = count($resArr);
					$cols = isset($resArr[0]) ? count($resArr[0]) : 0;
				}
			}
		}

		$this->menuItems["query"]["active"] = TRUE;

		$titleString = "Admin panel | DB queries";

		$this->buildCSS();

		include(ADMIN_TPL_PATH."query.tpl");
	}
}
