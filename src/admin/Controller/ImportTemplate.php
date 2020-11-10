<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\ImportTemplateModel;

class ImportTemplate extends AdminController
{
    protected $model = null;


    protected function onStart()
    {
        $this->model = ImportTemplateModel::getInstance();
    }


    public function index()
    {
        $itemsData = $this->model->getData();

        $this->menuItems["importtpl"]["active"] = true;

        $titleString = "Admin panel | Import templates";

        $this->buildCSS();

        $this->jsArr[] = "view.js";
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "importtplview.js"
        );

        include(ADMIN_TPL_PATH . "importtpl.tpl");
    }
}
