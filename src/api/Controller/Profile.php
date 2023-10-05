<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\CategoryModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Model\ScheduledTransactionModel;
use JezveMoney\App\Model\UserCurrencyModel;
use JezveMoney\App\Model\UserSettingsModel;

/**
 * Profile API controller
 */
class Profile extends ApiController
{
    protected $personMod = null;

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->personMod = PersonModel::getInstance();
        if (!$this->user_id) {
            throw new \Error("User not found");
        }
    }

    /**
     * Reads profile data
     */
    public function read()
    {
        $pObj = $this->personMod->getItem($this->owner_id);
        if (!$pObj) {
            throw new \Error("Person not found");
        }

        $userObj = $this->uMod->getItem($this->user_id);

        $settingsModel = UserSettingsModel::getInstance();
        $settings = $settingsModel->getSettings();

        $this->ok([
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "login" => $userObj->login,
            "access" => $userObj->access,
            "name" => $pObj->name,
            "settings" => $settings->getUserData(),
        ]);
    }

    /**
     * Changes user name
     */
    public function changename()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $this->runTransaction(function () {
            $requiredFields = ["name"];

            $request = $this->getRequestData();
            $reqData = checkFields($request, $requiredFields, true);

            $result = false;
            try {
                $result = $this->personMod->update($this->owner_id, $reqData);
            } catch (\Error $e) {
                wlog("Change name error: " . $e->getMessage());
            }
            if (!$result) {
                throw new \Error(__("profile.errors.changeName"));
            }

            $this->setMessage(__("profile.nameChangedMessage"));
            $this->ok($reqData);
        });
    }

    /**
     * Changes user password
     */
    public function changepass()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $this->runTransaction(function () {
            $requiredFields = ["current", "new"];

            $request = $this->getRequestData();
            $reqData = checkFields($request, $requiredFields, true);

            $uObj = $this->uMod->getItem($this->user_id);
            if (!$uObj) {
                throw new \Error(__("profile.errors.changePassword"));
            }

            $result = false;
            try {
                $result = $this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"]);
            } catch (\Error $e) {
                wlog("Change password error: " . $e->getMessage());
            }
            if (!$result) {
                throw new \Error(__("profile.errors.changePassword"));
            }

            $this->setMessage(__("profile.passwordChangedMessage"));
            $this->ok();
        });
    }

    /**
     * Removes all currencies of user
     */
    private function resetUserCurrencies()
    {
        $model = UserCurrencyModel::getInstance();
        $result = false;
        try {
            $result = $model->reset();
        } catch (\Error $e) {
            wlog("Reset user currencies error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all accounts of user
     *
     * @param bool $deletePersons delete persons flag
     */
    private function resetAccounts(bool $deletePersons = false)
    {
        $accMod = AccountModel::getInstance();
        $result = false;
        try {
            $result = $accMod->reset(["deletePersons" => $deletePersons]);
        } catch (\Error $e) {
            wlog("Reset accounts error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all persons of user
     */
    private function resetPersons()
    {
        $result = false;
        try {
            $result = $this->personMod->reset();
        } catch (\Error $e) {
            wlog("Reset persons error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all categories of user
     */
    private function resetCategories()
    {
        $categoryModel = CategoryModel::getInstance();
        $result = false;
        try {
            $result = $categoryModel->reset();
        } catch (\Error $e) {
            wlog("Reset accounts error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all transactions of user
     */
    private function resetTransactions($keepBalance = false)
    {
        $transMod = TransactionModel::getInstance();
        $result = false;
        try {
            $result = $transMod->reset($keepBalance);
        } catch (\Error $e) {
            wlog("Reset transactions error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all scheduled transactions of user
     */
    private function resetScheduledTransactions()
    {
        $model = ScheduledTransactionModel::getInstance();
        $result = false;
        try {
            $result = $model->reset();
        } catch (\Error $e) {
            wlog("Reset scheduled transactions error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all import templates of user
     */
    private function resetImportTemplates()
    {
        $tplModel = ImportTemplateModel::getInstance();
        $result = false;
        try {
            $result = $tplModel->reset();
        } catch (\Error $e) {
            wlog("Reset import templates error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Removes all import rules of user
     */
    private function resetImportRules()
    {
        $rulesModel = ImportRuleModel::getInstance();
        $result = false;
        try {
            $result = $rulesModel->reset();
        } catch (\Error $e) {
            wlog("Reset import rules error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("profile.errors.resetData"));
        }
    }

    /**
     * Resets user data
     */
    public function reset()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $this->runTransaction(function () {
            $resetOptions = [
                "currencies",
                "accounts",
                "persons",
                "categories",
                "transactions",
                "schedule",
                "keepbalance",
                "importtpl",
                "importrules"
            ];
            $request = $this->getRequestData();
            foreach ($resetOptions as $opt) {
                $request[$opt] = isset($request[$opt]);
            }

            if ($request["currencies"]) {
                $this->resetUserCurrencies();
            }
            if ($request["accounts"]) {
                $this->resetAccounts($request["persons"]);
            }
            if ($request["persons"]) {
                $this->resetPersons();
            }
            if ($request["categories"]) {
                $this->resetCategories();
            }
            if ($request["transactions"]) {
                $this->resetTransactions($request["keepbalance"]);
            }
            if ($request["schedule"]) {
                $this->resetScheduledTransactions();
            }
            if ($request["importtpl"]) {
                $this->resetImportTemplates();
            }
            if ($request["importrules"]) {
                $this->resetImportRules();
            }

            $this->setMessage(__("profile.resetMessage"));
            $this->ok();
        });
    }

    /**
     * Updates user settings
     */
    public function updateSettings()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->runTransaction(function () {
            $request = $this->getRequestData();
            if (!$request) {
                throw new \Error(__("errors.invalidRequestData"));
            }

            $updateResult = false;
            try {
                $settingsModel = UserSettingsModel::getInstance();
                $updateResult = $settingsModel->updateSettings($request);
            } catch (\Error $e) {
                wlog("Update item error: " . $e->getMessage());
            }
            if (!$updateResult) {
                throw new \Error(__("settings.errors.update"));
            }

            $this->ok();
        });
    }

    /**
     * Removes user profile
     */
    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $this->runTransaction(function () {
            $result = false;
            try {
                $result = $this->uMod->del($this->user_id);
            } catch (\Error $e) {
                wlog("Delete profile error: " . $e->getMessage());
            }
            if (!$result) {
                throw new \Error(__("profile.errors.delete"));
            }

            Message::setSuccess(__("profile.deletedMessage"));
            $this->setMessage(__("profile.deletedMessage"));
            $this->ok();
        });
    }
}
