<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Item\PersonItem;
use JezveMoney\App\Model\CategoryModel;

/**
 * State API controller
 */
class State extends ApiController
{
    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();
    }

    /**
     * /api/state/ route handler
     * Returns application state object
     */
    public function index()
    {
        $trModel = TransactionModel::getInstance();
        $accModel = AccountModel::getInstance();
        $pModel = PersonModel::getInstance();
        $catModel = CategoryModel::getInstance();
        $tplModel = ImportTemplateModel::getInstance();
        $ruleModel = ImportRuleModel::getInstance();

        $res = new \stdClass();
        // Accounts
        $res->accounts = new \stdClass();
        $items = $accModel->getData(["owner" => "all", "visibility" => "all"]);
        $res->accounts->data = $items;
        $res->accounts->autoincrement = $accModel->autoIncrement();
        // Transactions
        $res->transactions = new \stdClass();
        $res->transactions->data = $trModel->getData(["onPage" => 0]);
        $res->transactions->autoincrement = $trModel->autoIncrement();
        // Persons
        $res->persons = new \stdClass();
        $res->persons->data = $pModel->getData(["visibility" => "all"]);
        $res->persons->autoincrement = $pModel->autoIncrement();
        // Categories
        $res->categories = new \stdClass();
        $res->categories->data = $catModel->getData();
        $res->categories->autoincrement = $catModel->autoIncrement();
        // Import templates
        $res->templates = new \stdClass();
        $res->templates->data = $tplModel->getData();
        $res->templates->autoincrement = $tplModel->autoIncrement();
        // Import templates
        $res->rules = new \stdClass();
        $res->rules->data = $ruleModel->getData(["extended" => true]);
        $res->rules->autoincrement = $ruleModel->autoIncrement();
        // User profile
        $userObj = $this->uMod->getItem($this->user_id);
        if (!$userObj) {
            throw new \Error("User not found");
        }

        $res->profile = new \stdClass();
        $pObj = $pModel->getItem($this->owner_id);
        if (!$pObj) {
            throw new \Error("Person not found");
        }
        $res->profile->login = $userObj->login;
        $res->profile->user_id = $this->user_id;
        $res->profile->owner_id = $this->owner_id;
        $res->profile->name = $pObj->name;

        $this->ok($res);
    }
}
