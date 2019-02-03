<?php

class TestsAdminController extends Controller
{
	public function index()
	{
		global $menuItems;

		$titleString = "Admin panel | Tests";

		$this->cssAdmin[] = "tests.css";
		$this->buildCSS();
		$this->jsAdmin[] = "tests.js";

		include("./view/templates/tests.tpl");
	}
}
