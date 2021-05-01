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

        array_push(
            $this->css->libs,
            "lib/iconlink.css",
            "lib/dropdown.css"
        );
        $this->css->page = [
            "../Components/ImportUploadDialog/style.css",
            "../Components/ImportTemplateManager/style.css",
            "../Components/ImportTransactionItem/style.css",
            "../Components/ImportRulesDialog/style.css",
            "../Components/ImportRuleItem/style.css",
            "../Components/ImportRuleForm/style.css",
            "../Components/ImportConditionItem/style.css",
            "../Components/ImportConditionForm/style.css",
            "../Components/ImportActionItem/style.css",
            "../Components/ImportActionForm/style.css",
            "import.css"
        ];
        $this->buildCSS();

        array_push(
            $this->jsArr,
            "model/List.js",
            "model/Account.js",
            "model/AccountList.js",
            "model/Currency.js",
            "model/CurrencyList.js",
            "model/Person.js",
            "model/PersonList.js",
            "model/ImportCondition.js",
            "model/ImportConditionList.js",
            "model/ImportAction.js",
            "model/ImportActionList.js",
            "model/ImportRule.js",
            "model/ImportRuleList.js",
            "error/ImportConditionValidationError.js",
            "error/ImportActionValidationError.js",
            "model/ImportTemplate.js",
            "model/ImportTemplateList.js",
            "lib/dragndrop.js",
            "lib/sortable.js",
            "lib/dropdown.js",
            "lib/decimalinput.js",
            "../Components/Header/Header.js",
            "../Components/IconLink/IconLink.js",
            "component/uploader.js",
            "../Components/ConfirmDialog/ConfirmDialog.js",
            "../Components/AppComponent/AppComponent.js",
            "../Components/ImportUploadDialog/ImportUploadDialog.js",
            "../Components/ImportFileUploader/ImportFileUploader.js",
            "../Components/ImportTemplateManager/ImportTemplateManager.js",
            "../Components/ImportTransactionItem/ImportTransactionItem.js",
            "../Components/ImportRulesDialog/ImportRulesDialog.js",
            "../Components/ImportRuleItem/ImportRuleItem.js",
            "../Components/ImportRuleForm/ImportRuleForm.js",
            "../Components/ImportConditionItem/ImportConditionItem.js",
            "../Components/ImportConditionForm/ImportConditionForm.js",
            "../Components/ImportActionItem/ImportActionItem.js",
            "../Components/ImportActionForm/ImportActionForm.js",
            "View.js",
            "ImportView.js"
        );

        if (
            $this->uMod->isAdmin($this->user_id)
            || $this->uMod->isTester($this->user_id)
        ) {
            array_push($this->jsArr, "../Components/ImportFileUploader/ImportFileUploaderAdmin.js");
        }

        $titleString = "Jezve Money | Import transactions";

        include(TPL_PATH . "import.tpl");
    }
}
