<?php

class LogsAdminController extends AdminController
{
	public function index()
	{
		$contents = Logger::read();

		$this->menuItems["log"]["active"] = TRUE;

		$titleString = "Admin panel | Log";

		$this->buildCSS();

		include("./view/templates/log.tpl");
	}


	public function clean()
	{
		if (isset($_POST["clean"]) && $_POST["clean"] == "1")
		{
			Logger::clean();
		}

		setLocation(BASEURL."admin/log/");
	}
}
