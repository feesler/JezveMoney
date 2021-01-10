<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Model\ImportTemplateModel;

class Import extends TemplateController
{
    protected function onStart()
    {
        $this->templateModel = ImportTemplateModel::getInstance();
        $this->ruleModel = ImportRuleModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
    }


    public function index()
    {
        $accMod = AccountModel::getInstance();
        $accArr = $accMod->getData();
        $currMod = CurrencyModel::getInstance();
        $currArr = $currMod->getData();
        $persArr = $this->personMod->getData();
        $impTemplates = $this->templateModel->getData();
        $tplColumnTypes = $this->templateModel->getColumnTypes();

        $rules = $this->ruleModel->getData();
        $rulesData = [];
        foreach ($rules as $rule) {
            $rule->actions = $this->actionModel->getData(["rule" => $rule->id]);
            $rulesData[] = $rule;
        }

        $this->css->libs[] = "lib/iconlink.css";
        $this->css->page = [
            "import-upload-form.css",
            "import-template.css",
            "import-item.css",
            "import.css"
        ];
        $this->buildCSS();

        array_push(
            $this->jsArr,
            "model/list.js",
            "model/account.js",
            "model/currency.js",
            "model/person.js",
            "model/importcondition.js",
            "model/importaction.js",
            "model/importrule.js",
            "model/importtpl.js",
            "lib/ajax.js",
            "lib/dragndrop.js",
            "lib/sortable.js",
            "lib/popup.js",
            "lib/component.js",
            "component/header.js",
            "component/iconlink.js",
            "component/uploader.js",
            "component/confirmdialog.js",
            "component/importuploaddialog.js",
            "component/importfileuploader.js",
            "component/importtemplatemanager.js",
            "component/importtransactionitem.js",
            "view.js",
            "importview.js"
        );

        if (
            $this->uMod->isAdmin($this->user_id)
            || $this->uMod->isTester($this->user_id)
        ) {
            array_push($this->jsArr, "importadmin.js");
        }

        $titleString = "Jezve Money | Import transactions";

        include(TPL_PATH . "import.tpl");
    }
}
