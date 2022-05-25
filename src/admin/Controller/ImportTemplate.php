<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
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
        $this->template = new Template(ADMIN_TPL_PATH . "importtpl.tpl");
        $data = [
            "titleString" => "Admin panel | Import templates",
            "itemsData" => $this->model->getData(),
        ];

        $data["viewData"] = [
            "data" => $data["itemsData"],
        ];

        $this->menuItems["importtpl"]["active"] = true;
        $this->cssAdmin[] = "AdminImportTplView.css";
        $this->jsAdmin[] = "AdminImportTplView.js";

        $this->render($data);
    }
}
