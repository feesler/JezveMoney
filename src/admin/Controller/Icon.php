<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\IconModel;

class Icon extends AdminController
{
    protected $model = null;


    protected function onStart()
    {
        $this->model = IconModel::getInstance();
    }


    public function index()
    {
        $itemsData = $this->model->getData();
        $typesData = $this->model->getTypes();
        $viewData = [
            "data" => $itemsData
        ];

        $this->menuItems["icon"]["active"] = true;

        $titleString = "Admin panel | Icons";

        $this->cssAdmin[] = "AdminIconView.css";
        $this->buildCSS();
        $this->jsAdmin[] = "AdminIconView.js";

        include(ADMIN_TPL_PATH . "icon.tpl");
    }
}
