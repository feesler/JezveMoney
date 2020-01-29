<?php

class MainAdminController extends AdminController
{
	public function index()
	{
		$titleString = "Admin panel";

		$this->buildCSS();

		include("./view/templates/index.tpl");
	}
}
