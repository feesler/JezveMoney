<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

	$uMod = new UserModel();
	$user_id = $uMod->check();
	if (!$user_id || !$uMod->isAdmin($user_id))
		setLocation("../login.php");


	$query = NULL;
	if (isset($_POST["query"]) && $_POST["query"] != "")
	{
		$query = $_POST["query"];

		if (isset($_POST["qtype"]) && $_POST["qtype"] == "1")		// select query
		{
			$resArr = array();
			$result = $db->rawQ($query);
			$qerr_num = mysql_errno();
			$qerror = mysql_error();
			if ($result && !$qerr_num && mysql_num_rows($result) > 0)
			{
				while($row = mysql_fetch_array($result, MYSQL_ASSOC))
					$resArr[] = $row;

				$rows = count($resArr);
				$cols = isset($resArr[0]) ? count($resArr[0]) : 0;
			}
		}
	}


	$menuItems["query"]["active"] = TRUE;

	$titleString = "Admin panel | DB queries";

	$cssMainArr = array("common.css", "iconlink.css", "app.css");
	$cssLocalArr = array("admin.css", "query.css");
	$jsMainArr = array("es5-shim.min.js", "common.js", "app.js");
	$jsLocalArr = array();

	include("./view/templates/query.tpl");
