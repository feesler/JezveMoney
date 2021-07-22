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
        $rulesData = $this->ruleModel->getData(["extended" => true]);

        $viewData = [
            "accounts" => $accArr,
            "currencies" => $currArr,
            "persons" => $persArr,
            "rules" => $rulesData,
            "templates" => $impTemplates
        ];

        $this->cssArr[] = "ImportView.css";
        $this->buildCSS();
        $this->jsArr[] = "ImportView.js";

        $titleString = "Jezve Money | Import transactions";

        include(TPL_PATH . "import.tpl");
    }
}
