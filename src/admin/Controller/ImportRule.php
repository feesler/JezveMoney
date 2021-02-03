<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportConditionModel;
use JezveMoney\App\Model\ImportActionModel;

class ImportRule extends AdminController
{
    protected $model = null;


    protected function onStart()
    {
        $this->model = ImportRuleModel::getInstance();
    }


    public function index()
    {
        $itemsData = $this->model->getData(["full" => true]);

        $actTypeData = ImportActionModel::getActions();
        $fieldsData = ImportConditionModel::getFields();
        $operatorsData = ImportConditionModel::getOperators();

        $viewData = [
            "data" => $itemsData,
            "actionTypes" => $actTypeData,
            "fields" => $fieldsData,
            "operators" => $operatorsData
        ];

        $this->menuItems["importrule"]["active"] = true;

        $titleString = "Admin panel | Import rules";

        $this->cssAdmin[] = "importrule.css";
        $this->buildCSS();

        array_push(
            $this->jsArr,
            "component/confirmdialog.js",
            "model/list.js",
            "view.js"
        );
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "importconditionview.js",
            "importactionview.js",
            "importruleview.js"
        );

        include(ADMIN_TPL_PATH . "importrule.tpl");
    }
}
