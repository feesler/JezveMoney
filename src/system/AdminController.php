<?php

namespace JezveMoney\Core;

abstract class AdminController extends TemplateController
{
    protected $cssAdmin = [];
    protected $jsAdmin = [];
    protected $jsAdminModule = [];

    protected $menuItems = [
        "dbinstall" => [ "title" => "DB update", "link" => "dbinstall/" ],
        "curr" => [ "title" => "Currencies", "link" => "currency/" ],
        "icon" => [ "title" => "Icons", "link" => "icon/" ],
        "importtpl" => [ "title" => "Import templates", "link" => "importtpl/" ],
        "importrule" => [ "title" => "Import rules", "link" => "importrule/" ],
        "query" => [ "title" => "Queries", "link" => "query/" ],
        "log" => [ "title" => "Logs", "link" => "log/" ],
        "balance" => [ "title" => "Balance", "link" => "balance/" ],
        "tests" => [ "title" => "Tests", "link" => "tests/" ],
        "apiconsole" => [ "title" => "API console", "link" => "apiconsole/" ],
        "users" => [ "title" => "Users", "link" => "user/" ]
    ];


    public function initDefResources()
    {
        $this->cssArr = [];
        $this->cssAdmin = [];
        $this->jsAdmin = [];
    }


    protected function buildCSS()
    {
        $this->cssAdmin = (array)$this->cssAdmin;

        parent::buildCSS();

        $this->adminThemes = getThemes("view/css/");
        $this->adminThemeStylesheet = $this->adminThemes[$this->userTheme];
    }
}
