<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\ColorModel;

/**
 * Colors admin controller
 */
class Color extends AdminController
{
    protected $model = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->model = ColorModel::getInstance();
    }

    /**
     * /admin/color/ route handler
     * Renders icons view
     */
    public function index()
    {
        $this->template = new Template(ADMIN_VIEW_TPL_PATH . "Color.tpl");
        $data = [
            "titleString" => "Admin panel | Colors",
            "itemsData" => $this->model->getData(),
        ];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "view" => [
                "data" => $data["itemsData"],
            ],
        ];

        $this->initResources("AdminColorView");
        $this->render($data);
    }
}
