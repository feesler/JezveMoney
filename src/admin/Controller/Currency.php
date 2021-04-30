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
        $itemsData = $this->model->getData();
        $viewData = [
            "data" => $itemsData
        ];

        $this->menuItems["curr"]["active"] = true;

        $titleString = "Admin panel | Currency";

        $this->buildCSS();
        array_push(
            $this->jsArr,
            "../Components/ConfirmDialog/ConfirmDialog.js",
            "view.js"
        );
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "currencyview.js"
        );

        include(ADMIN_TPL_PATH . "currency.tpl");
    }
}
