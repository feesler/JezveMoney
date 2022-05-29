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
        $this->template = new Template(TPL_PATH . "import.tpl");
        $this->template->testerUser =  $this->uMod->isTester($this->user_id);
        $data = [];

        $accMod = AccountModel::getInstance();
        $data["accArr"] = $accMod->getData(["type" => "all"]);
        $importAvailable = count($data["accArr"]) > 0;
        $data["importAvailable"] = $importAvailable;
        $data["importNotAvailableMessage"] = MSG_NO_ACCOUNTS_AVAILABLE;
        $currMod = CurrencyModel::getInstance();
        $currArr = $currMod->getData();
        $persArr = $this->personMod->getData(["type" => "all"]);
        $data["impTemplates"] = $this->templateModel->getData();
        $data["tplColumnTypes"] = $this->templateModel->getColumnTypes();
        $data["rulesData"] = $this->ruleModel->getData(["extended" => true]);

        $data["uploadBtn"] = [
            "id" => "uploadBtn",
            "title" => "Upload file",
            "icon" => "import"
        ];
        if (!$importAvailable) {
            $data["uploadBtn"]["attributes"] = ["disabled" => !$importAvailable];
        }

        $data["viewData"] = [
            "accounts" => $data["accArr"],
            "currencies" => $currArr,
            "persons" => $persArr,
            "rules" => $data["rulesData"],
            "templates" => $data["impTemplates"]
        ];

        $this->cssArr[] = "ImportView.css";
        $this->jsArr[] = "ImportView.js";

        $data["titleString"] = "Jezve Money | Import transactions";

        $this->render($data);
    }
}
