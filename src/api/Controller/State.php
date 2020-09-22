<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Item\AccountItem;
use JezveMoney\App\Item\PersonItem;
use JezveMoney\App\Item\TransactionItem;

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
    }


    public function index()
    {
        $res = new \stdClass();

        $res->accounts = new \stdClass();
        $res->accounts->data = [];
        $items = $this->accModel->getData([ "full" => true, "type" => "all" ]);
        foreach ($items as $item) {
            $res->accounts->data[] = new AccountItem($item);
        }
        $res->accounts->autoincrement = $this->accModel->autoIncrement();

        $res->transactions = new \stdClass();
        $res->transactions->data = [];
        $items = $this->trModel->getData([ "onPage" => 0 ]);
        foreach ($items as $item) {
            $res->transactions->data[] = new TransactionItem($item);
        }
        $res->transactions->autoincrement = $this->trModel->autoIncrement();

        $res->persons = new \stdClass();
        $res->persons->data = [];
        $items = $this->pModel->getData([ "type" => "all" ]);
        foreach ($items as $item) {
            $res->persons->data[] = new PersonItem($item);
        }
        $res->persons->autoincrement = $this->pModel->autoIncrement();

        $userObj = $this->uMod->getItem($this->user_id);
        if (!$userObj) {
            $this->fail("User not found");
        }

        $res->profile = new \stdClass();
        $pObj = $this->pModel->getItem($this->owner_id);
        if (!$pObj) {
            $this->fail("Person not found");
        }
        $res->profile->login = $userObj->login;
        $res->profile->user_id = $this->user_id;
        $res->profile->owner_id = $this->owner_id;
        $res->profile->name = $pObj->name;

        $this->ok($res);
    }
}
