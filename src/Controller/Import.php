<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\CurrencyModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Model\ReminderModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\UserCurrencyModel;

/**
 * Import controller
 */
class Import extends TemplateController
{
    /**
     * /import/ route handler
     * Renders import view
     */
    public function index()
    {
        $templateModel = ImportTemplateModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();
        $catModel = CategoryModel::getInstance();
        $accMod = AccountModel::getInstance();
        $currMod = CurrencyModel::getInstance();
        $userCurrModel = UserCurrencyModel::getInstance();
        $scheduleModel = ScheduledTransactionModel::getInstance();
        $reminderModel = ReminderModel::getInstance();

        $this->template = new Template(VIEW_TPL_PATH . "Import.tpl");

        $data = [
            "titleString" => __("appName") . " | " . __("import.listTitle"),
        ];

        $data["appProps"] = [
            "profile" => $this->getProfileData(),
            "accounts" => $accMod->getData(["visibility" => "all", "owner" => "all"]),
            "currency" => $currMod->getData(),
            "userCurrencies" => $userCurrModel->getData(),
            "persons" => $this->personMod->getData(["visibility" => "all"]),
            "categories" => $catModel->getData(),
            "schedule" => $scheduleModel->getData(),
            "reminders" => $reminderModel->getData(),
            "rules" => $ruleModel->getData(["extended" => true]),
            "templates" => $templateModel->getData(),
            "tplColumnTypes" => $templateModel->getColumnTypes(),
        ];

        $this->initResources("ImportView");
        $this->render($data);
    }
}
