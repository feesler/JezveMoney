<?php

abstract class AdminController extends TemplateController
{
	protected $cssAdmin = [];
	protected $jsAdmin = [];
	protected $jsAdminModule = [];

	protected $menuItems = [
		"dbinstall" => [ "title" => "DB update", "link" => "dbinstall/" ],
		"curr" => [ "title" => "Currencies", "link" => "currency/" ],
		"query" => [ "title" => "Queries", "link" => "query/" ],
		"log" => [ "title" => "Logs", "link" => "log/" ],
		"balance" => [ "title" => "Balance", "link" => "balance/" ],
		"tests" => [ "title" => "Tests", "link" => "tests/" ],
		"apiconsole" => [ "title" => "API console", "link" => "apiconsole/" ],
		"users" => [ "title" => "Users", "link" => "user/" ]
	];


	public function initDefResources()
	{
		$this->css = new stdClass;
		$this->css->clear = ["common.css"];
		$this->css->libs = ["popup.css"];
		$this->css->app = ["app.css"];
		$this->css->page = [];
		$this->cssAdmin = ["admin.css"];

		$this->jsArr = ["lib/polyfill.min.js", "common.js", "ajax.js", "popup.js", "app.js"];
		$this->jsAdmin = [];
		$this->jsAdminModule = [];
	}


	protected function buildCSS()
	{
		$this->cssAdmin = (array)$this->cssAdmin;

		parent::buildCSS();

		$this->adminThemes = getThemes("view/css/");
		$this->adminThemeStylesheet = $this->adminThemes[$this->userTheme];
	}
}
