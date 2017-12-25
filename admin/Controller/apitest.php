<?php

class APITestAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$menuItems["apitest"]["active"] = TRUE;

		$titleString = "Admin panel | API test";

		$this->cssAdmin[] = "apitest.css";
		$this->buildCSS();
		$this->jsAdmin[] = "apitest.js";

		include("./view/templates/apitest.tpl");
	}
}
