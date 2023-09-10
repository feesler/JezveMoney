<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\IconModel;

/**
 * Icons admin controller
 */
class Icon extends AdminController
{
    protected $model = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = IconModel::getInstance();
    }

    /**
     * /admin/icon/ route handler
     * Renders icons view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Icon.tpl");
        $data = [
            "titleString" => "Admin panel | Icons",
            "itemsData" => $this->model->getData(),
            "typesData" => $this->model->getTypes(),
        ];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "view" => [
                "data" => $data["itemsData"],
            ],
        ];

        $this->initResources("AdminIconView");
        $this->render($data);
    }
}
