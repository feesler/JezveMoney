<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\Core\Template;
use JezveMoney\Core\JSON;
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
        $this->template = new Template(ADMIN_TPL_PATH . "importrule.tpl");
        $data = [
            "titleString" => "Admin panel | Import rules",
            "itemsData" => $this->model->getData(["full" => true]),
            "actTypeData" => ImportActionModel::getActions(),
            "fieldsData" => ImportConditionModel::getFields(),
            "operatorsData" => ImportConditionModel::getOperators(),
        ];

        $data["viewData"] = JSON::encode([
            "data" => $data["itemsData"],
            "actionTypes" => $data["actTypeData"],
            "fields" => $data["fieldsData"],
            "operators" => $data["operatorsData"],
        ]);

        $this->menuItems["importrule"]["active"] = true;
        $this->cssAdmin[] = "AdminImportRuleView.css";
        $this->jsAdmin[] = "AdminImportRuleView.js";

        $this->render($data);
    }
}
