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

        $this->menuItems["icon"]["active"] = true;

        $titleString = "Admin panel | Icons";

        $this->buildCSS();

        array_push(
            $this->jsArr,
            "lib/component.js",
            "component/confirmdialog.js",
            "view.js"
        );
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "iconview.js"
        );

        include(ADMIN_TPL_PATH . "icon.tpl");
    }
}
