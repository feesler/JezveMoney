<?php

namespace JezveMoney\App\Admin\Controller;

use JezveMoney\Core\AdminController;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportActionModel;

class ImportRule extends AdminController
{
    protected $model = null;


    protected function onStart()
    {
        $this->model = ImportRuleModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
    }


    public function index()
    {
        $rulesData = $this->model->getData(["full" => true]);
        $itemsData = [];
        foreach($rulesData as $rule){
            $item = clone $rule;
            $item->fieldName = ImportRuleModel::getFieldName($item->field_id);
            $item->operatorName = ImportRuleModel::getOperatorName($item->operator);
            if (ImportRuleModel::isFieldValueOperator($item->operator)){
                $item->valueStr = ImportRuleModel::getFieldName($item->value);
            } else {
                $item->valueStr = $item->value;
            }
            $itemsData[] = $item;
        }

        $actTypeData = ImportActionModel::getActions();
        $fieldsData = ImportRuleModel::getFields();
        $operatorsData = ImportRuleModel::getOperators();

        $this->menuItems["importrule"]["active"] = true;

        $titleString = "Admin panel | Import rules";

        $this->buildCSS();

        array_push(
            $this->jsArr,
            "lib/component.js",
            "component/confirmdialog.js",
            "model/list.js",
            "view.js"
        );
        array_push(
            $this->jsAdmin,
            "adminview.js",
            "adminlistview.js",
            "importactionview.js",
            "importruleview.js"
        );

        include(ADMIN_TPL_PATH . "importrule.tpl");
    }
}
