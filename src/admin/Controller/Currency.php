<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
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
        $currArr = $this->model->getData();

        $this->menuItems["curr"]["active"] = true;

        $titleString = "Admin panel | Currency";

        $this->buildCSS();
        $this->cssAdmin[] = "currency.css";

        $this->jsArr[] = "currency.js";
        $this->jsAdmin[] = "currency.js";

        include(ADMIN_TPL_PATH . "currency.tpl");
    }
}
