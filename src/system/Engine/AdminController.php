<?php

namespace JezveMoney\Core;

abstract class AdminController extends TemplateController
{
    protected $cssAdmin = [];
    protected $jsAdmin = [];
    protected $jsAdminModule = [];
    protected $themesPath = "admin/view/css/themes/";

    protected $menuItems = [
        "dbinstall" => [ "title" => "DB update", "link" => "dbinstall/" ],
        "curr" => [ "title" => "Currencies", "link" => "currency/" ],
        "icon" => [ "title" => "Icons", "link" => "icon/" ],
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
            "polyfill/index.js",
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
