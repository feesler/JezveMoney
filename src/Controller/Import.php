<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
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
        $this->catModel = CategoryModel::getInstance();
    }


    public function index()
    {
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();

        $this->template = new Template(VIEW_TPL_PATH . "Import.tpl");
        $this->template->testerUser =  $this->uMod->isTester($this->user_id);

        $accounts = $accMod->getData(["visibility" => "all"]);
        $importAvailable = count($accounts) > 0;

        $data = [
            "titleString" => __("APP_NAME") . " | " . __("IMPORT"),
            "accounts" => $accounts,
            "importAvailable" => $importAvailable,
            "importNotAvailableMessage" => __("IMPORT_NO_ACCOUNTS_MSG"),
            "importTemplates" => $this->templateModel->getData(),
            "tplColumnTypes" => $this->templateModel->getColumnTypes(),
            "importRules" => $this->ruleModel->getData(["extended" => true]),
            "uploadBtn" => [
                "id" => "uploadBtn",
                "classNames" => "circle-icon",
                "title" => __("IMPORT_UPLOAD"),
                "icon" => "import",
            ],
        ];

        if (!$importAvailable) {
            $data["uploadBtn"]["attributes"] = ["disabled" => ""];
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $data["accounts"],
            "currency" => $currMod->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
            "rules" => $data["importRules"],
            "templates" => $data["importTemplates"]
        ];

        $this->cssArr[] = "ImportView.css";
        $this->jsArr[] = "ImportView.js";

        $this->render($data);
    }
}
