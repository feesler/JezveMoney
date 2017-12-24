<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

class LogsAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$menuItems["apitest"]["active"] = TRUE;

		$titleString = "Admin panel | API test";

		$this->cssAdmin = array("admin.css", "apitest.css");
		$this->buildCSS();
		$this->jsAdmin[] = "apitest.js";

		include("./view/templates/apitest.tpl");
	}
}

	checkUser(TRUE, TRUE);

	$controller = new LogsAdminController();
	$controller->initDefResources();
	$controller->index();
