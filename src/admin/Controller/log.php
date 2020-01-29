<?php

class LogsAdminController extends AdminController
{
	protected function onStart()
	{
		$this->filename = APPROOT."system/logs/log.txt";
	}


	public function index()
	{
		$contents = "";
		if (file_exists($this->filename) && is_readable($this->filename))
		{
			$contents = file_get_contents($this->filename);
		}

		$this->menuItems["log"]["active"] = TRUE;

		$titleString = "Admin panel | Log";

		$this->buildCSS();

		include("./view/templates/log.tpl");
	}


	public function clean()
	{
		if (isset($_POST["clean"]) && $_POST["clean"] == "1")
		{
			if (file_exists($this->filename))
				unlink($this->filename);
		}

		setLocation(BASEURL."admin/log/");
	}
}
