<?php

class MainAdminController extends AdminController
{
	public function index()
	{
		$titleString = "Admin panel";

		$this->buildCSS();

		include(ADMIN_TPL_PATH."index.tpl");
	}
}
