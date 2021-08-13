<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\CurrencyModel;

class Currency extends AdminController
{
    protected $model = null;


    protected function onStart()
    {
        $this->model = CurrencyModel::getInstance();
    }


    public function index()
    {
        $this->template = new Template(ADMIN_TPL_PATH . "currency.tpl");
        $data = [
            "titleString" => "Admin panel | Currency",
        ];

        $itemsData = $this->model->getData();
        $data["itemsData"] = $itemsData;
        $data["viewData"] = JSON::encode([
            "data" => $itemsData
        ]);

        $this->menuItems["curr"]["active"] = true;
        $this->cssAdmin[] = "AdminCurrencyView.css";
        $this->jsAdmin[] = "AdminCurrencyView.js";

        $this->render($data);
    }
}
