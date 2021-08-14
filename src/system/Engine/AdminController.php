<?php

namespace JezveMoney\Core;

abstract class AdminController extends TemplateController
{
    protected $cssAdmin = [];
    protected $jsAdmin = [];
    protected $jsAdminModule = [];
    protected $themesPath = "admin/view/themes/";

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
        $this->jsArr = [
            "polyfill/classList.min.js",
            "polyfill/polyfill.min.js"
        ];
        $this->jsAdmin = [];
    }


    protected function render($data = [])
    {
        $this->template->cssAdmin = (array)$this->cssAdmin;
        $this->template->jsAdmin = (array)$this->jsAdmin;
        $this->template->menuItems = $this->menuItems;

        parent::render($data);
    }
}
