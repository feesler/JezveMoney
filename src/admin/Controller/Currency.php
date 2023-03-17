<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\CurrencyModel;

/**
 * Currencies admin controller
 */
class Currency extends AdminController
{
    protected $model = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = CurrencyModel::getInstance();
    }

    /**
     * /admin/currency/ route handler
     * Renders currencies view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Currency.tpl");
        $data = [
            "titleString" => "Admin panel | Currency",
        ];

        $itemsData = $this->model->getData();
        $data["itemsData"] = $itemsData;
        $data["appProps"] = [
            "view" => [
                "data" => $itemsData,
            ],
        ];

        $this->initResources("AdminCurrencyView");
        $this->render($data);
    }
}
