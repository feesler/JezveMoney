<?php

class MainAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$titleString = "Admin panel";

		$this->buildCSS();

		include("./view/templates/index.tpl");
	}
}
