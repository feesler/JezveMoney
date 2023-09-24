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
use JezveMoney\App\Model\ReminderModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\UserCurrencyModel;

/**
 * Import controller
 */
class Import extends TemplateController
{
    protected $templateModel = null;
    protected $ruleModel = null;
    protected $actionModel = null;
    protected $catModel = null;

    /**
     * Controller initialization
     */
    protected function onStart()
    {
        $this->templateModel = ImportTemplateModel::getInstance();
        $this->ruleModel = ImportRuleModel::getInstance();
        $this->actionModel = ImportActionModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
    }

    /**
     * /import/ route handler
     * Renders import view
     */
    public function index()
    {
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();
        $scheduleModel = ScheduledTransactionModel::getInstance();
        $reminderModel = ReminderModel::getInstance();

        $this->template = new Template(VIEW_TPL_PATH . "Import.tpl");

        $userAccounts = $accMod->getUserAccounts();
        $accounts = $accMod->getData(["visibility" => "all", "owner" => "all"]);
        $importAvailable = count($userAccounts) > 0;

        $data = [
            "titleString" => __("appName") . " | " . __("import.listTitle"),
            "accounts" => $accounts,
            "testerUser" => $this->uMod->isTester($this->user_id),
            "importAvailable" => $importAvailable,
            "importNotAvailableMessage" => __("import.noAccountsMessage"),
            "importTemplates" => $this->templateModel->getData(),
            "tplColumnTypes" => $this->templateModel->getColumnTypes(),
            "importRules" => $this->ruleModel->getData(["extended" => true]),
            "uploadBtn" => [
                "id" => "uploadBtn",
                "classNames" => "circle-btn",
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
            "userCurrencies" => $userCurrModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $this->catModel->getData(),
            "schedule" => $scheduleModel->getData(),
            "reminders" => $reminderModel->getData(),
            "rules" => $data["importRules"],
            "templates" => $data["importTemplates"]
        ];

        $this->initResources("ImportView");
        $this->render($data);
    }
}
