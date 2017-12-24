<?php
	require_once("../system/setup.php");
	require_once("../system/admin.php");

class MainAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$titleString = "Admin panel";

		$this->cssAdmin[] = "admin.css";
		$this->buildCSS();

		include("./view/templates/index.tpl");
	}
}

	checkUser(TRUE, TRUE);

	$controller = new MainAdminController();

	$controller->initDefResources();

	$controller->index();
