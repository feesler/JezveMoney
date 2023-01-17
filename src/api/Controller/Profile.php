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

        $this->ok([
            "user_id" => $this->user_id,
            "owner_id" => $this->owner_id,
            "login" => $userObj->login,
            "name" => $pObj->name,
        ]);
    }

    /**
     * Changes user name
     */
    public function changename()
    {
        $requiredFields = ["name"];
        $defMsg = __("ERR_PROFILE_NAME");

        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields);
        if ($reqData === false) {
            throw new \Error($defMsg);
        }

        $this->begin();

        $result = false;
        try {
            $result = $this->personMod->update($this->owner_id, $reqData);
        } catch (\Error $e) {
            wlog("Change name error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error($defMsg);
        }

        $this->commit();

        $this->setMessage(__("MSG_PROFILE_NAME"));
        $this->ok($reqData);
    }

    /**
     * Changes user password
     */
    public function changepass()
    {
        $requiredFields = ["current", "new"];
        $defMsg = __("ERR_PROFILE_PASSWORD");

        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields);
        if ($reqData === false) {
            throw new \Error($defMsg);
        }

        $this->begin();

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            throw new \Error($defMsg);
        }

        $result = false;
        try {
            $result = $this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"]);
        } catch (\Error $e) {
            wlog("Change password error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error($defMsg);
        }

        $this->commit();

        $this->setMessage(__("MSG_PROFILE_PASSWORD"));
        $this->ok();
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
            throw new \Error(__("ERR_PROFILE_RESET"));
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
            throw new \Error(__("ERR_PROFILE_RESET"));
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
            throw new \Error(__("ERR_PROFILE_RESET"));
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
            throw new \Error(__("ERR_PROFILE_RESET"));
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
            throw new \Error(__("ERR_PROFILE_RESET"));
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
            throw new \Error(__("ERR_PROFILE_RESET"));
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

        $resetOptions = [
            "accounts",
            "persons",
            "categories",
            "transactions",
            "keepbalance",
            "importtpl",
            "importrules"
        ];
        $request = $this->getRequestData();
        foreach ($resetOptions as $opt) {
            $request[$opt] = isset($request[$opt]);
        }

        $this->begin();

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
        if ($request["importtpl"]) {
            $this->resetImportTemplates();
        }
        if ($request["importrules"]) {
            $this->resetImportRules();
        }

        $this->commit();

        $this->setMessage(__("MSG_PROFILE_RESET"));
        $this->ok();
    }

    /**
     * Removes user profile
     */
    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $this->begin();

        $result = false;
        try {
            $result = $this->uMod->del($this->user_id);
        } catch (\Error $e) {
            wlog("Delete profile error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error(__("ERR_PROFILE_DELETE"));
        }

        $this->commit();

        Message::setSuccess(__("MSG_PROFILE_DELETED"));
        $this->setMessage(__("MSG_PROFILE_DELETED"));
        $this->ok();
    }
}
