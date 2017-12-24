<?php
	$noLogs = TRUE;
	require_once("../system/setup.php");
	require_once("../system/admin.php");

class LogsAdminController extends Controller
{
	public function index()
	{
		global $menuItems, $approot;

		$filename = $approot."admin/log.txt";

		$contents = "";
		if (file_exists($filename))
		{
			$fp = fopen($filename, "r");
			if ($fp)
			{
				$contents = fread($fp, filesize($filename));
				fclose($fp);
			}
		}

		$menuItems["log"]["active"] = TRUE;

		$titleString = "Admin panel | Log";

		$this->cssAdmin[] = "admin.css";
		$this->buildCSS();

		include("./view/templates/log.tpl");
	}
}

	checkUser(TRUE, TRUE);

	$controller = new LogsAdminController();
	$controller->initDefResources();
	$controller->index();
