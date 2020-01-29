<?php

class ApiConsoleAdminController extends AdminController
{
	public function index()
	{
		$this->menuItems["apiconsole"]["active"] = TRUE;

		$titleString = "Admin panel | API console";

		$this->cssAdmin[] = "apiconsole.css";
		$this->buildCSS();
		$this->jsAdmin[] = "apiconsole.js";

		include("./view/templates/apiconsole.tpl");
	}
}
