<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Item\AccountItem;
use JezveMoney\App\Item\PersonItem;
use JezveMoney\App\Item\TransactionItem;
use JezveMoney\App\Model\CategoryModel;

class State extends ApiController
{
    protected $trModel = null;
    protected $accModel = null;
    protected $pModel = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->trModel = TransactionModel::getInstance();
        $this->accModel = AccountModel::getInstance();
        $this->pModel = PersonModel::getInstance();
        $this->catModel = CategoryModel::getInstance();
        $this->tplModel = ImportTemplateModel::getInstance();
        $this->ruleModel = ImportRuleModel::getInstance();
    }


    public function index()
    {
        $res = new \stdClass();
        // Accounts
        $res->accounts = new \stdClass();
        $items = $this->accModel->getData(["owner" => "all", "visibility" => "all"]);
        $res->accounts->data = $items;
        $res->accounts->autoincrement = $this->accModel->autoIncrement();
        // Transactions
        $res->transactions = new \stdClass();
        $res->transactions->data = [];
        $items = $this->trModel->getData(["onPage" => 0]);
        foreach ($items as $item) {
            $res->transactions->data[] = new TransactionItem($item);
        }
        $res->transactions->autoincrement = $this->trModel->autoIncrement();
        // Persons
        $res->persons = new \stdClass();
        $res->persons->data = [];
        $items = $this->pModel->getData(["visibility" => "all"]);
        foreach ($items as $item) {
            $res->persons->data[] = new PersonItem($item);
        }
        $res->persons->autoincrement = $this->pModel->autoIncrement();
        // Categories
        $res->categories = new \stdClass();
        $res->categories->data = $this->catModel->getData();
        $res->categories->autoincrement = $this->catModel->autoIncrement();
        // Import templates
        $res->templates = new \stdClass();
        $res->templates->data = $this->tplModel->getData();
        $res->templates->autoincrement = $this->tplModel->autoIncrement();
        // Import templates
        $res->rules = new \stdClass();
        $res->rules->data = $this->ruleModel->getData(["extended" => true]);
        $res->rules->autoincrement = $this->ruleModel->autoIncrement();
        // User profile
        $userObj = $this->uMod->getItem($this->user_id);
        if (!$userObj) {
            throw new \Error("User not found");
        }

        $res->profile = new \stdClass();
        $pObj = $this->pModel->getItem($this->owner_id);
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
