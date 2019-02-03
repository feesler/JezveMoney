<?php

class LogsAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$filename = APPROOT."admin/log.txt";

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

		$this->buildCSS();

		include("./view/templates/log.tpl");
	}


	public function clean()
	{
		$logfname = APPROOT."admin/log.txt";

		if (isset($_POST["clean"]) && $_POST["clean"] == "1")
		{
			if (file_exists($logfname))
				unlink($logfname);
		}

		setLocation(BASEURL."admin/log/");
	}
}
