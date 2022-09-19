<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportActionModel;
use JezveMoney\App\Model\ImportTemplateModel;

const MSG_NO_ACCOUNTS_AVAILABLE = "You have no one account. To start the import create one.";

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
        $currMod = CurrencyModel::getInstance();

        $this->template = new Template(VIEW_TPL_PATH . "Import.tpl");
        $this->template->testerUser =  $this->uMod->isTester($this->user_id);

        $accounts = $accMod->getData(["type" => "all"]);
        $importAvailable = count($accounts) > 0;

        $data = [
            "accounts" => $accounts,
            "importAvailable" => $importAvailable,
            "importNotAvailableMessage" => MSG_NO_ACCOUNTS_AVAILABLE,
            "importTemplates" => $this->templateModel->getData(),
            "tplColumnTypes" => $this->templateModel->getColumnTypes(),
            "importRules" => $this->ruleModel->getData(["extended" => true]),
            "uploadBtn" => [
                "id" => "uploadBtn",
                "title" => "Upload",
                "icon" => "import"
            ],
        ];

        if (!$importAvailable) {
            $data["uploadBtn"]["attributes"] = ["disabled" => !$importAvailable];
        }

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $data["accounts"],
            "currency" => $currMod->getData(),
            "persons" => $this->personMod->getData(["type" => "all"]),
            "rules" => $data["importRules"],
            "templates" => $data["importTemplates"]
        ];

        $this->cssArr[] = "ImportView.css";
        $this->jsArr[] = "ImportView.js";

        $data["titleString"] = "Jezve Money | Import";

        $this->render($data);
    }
}
