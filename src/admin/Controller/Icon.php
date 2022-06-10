<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
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
        $this->template = new Template(ADMIN_TPL_PATH . "icon.tpl");
        $data = [
            "titleString" => "Admin panel | Icons",
            "itemsData" => $this->model->getData(),
            "typesData" => $this->model->getTypes(),
        ];

        $data["appProps"] = [
            "view" => [
                "data" => $data["itemsData"],
            ],
        ];

        $this->menuItems["icon"]["active"] = true;
        $this->cssAdmin[] = "AdminIconView.css";
        $this->jsAdmin[] = "AdminIconView.js";

        $this->render($data);
    }
}
