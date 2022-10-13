<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\AccountModel;
use JezveMoney\App\Model\PersonModel;
use JezveMoney\App\Model\TransactionModel;
use JezveMoney\App\Model\ImportRuleModel;
use JezveMoney\App\Model\ImportTemplateModel;

class Profile extends ApiController
{
    protected $personMod = null;


    public function initAPI()
    {
        parent::initAPI();

        $this->personMod = PersonModel::getInstance();
        if (!$this->user_id) {
            throw new \Error("User not found");
        }
    }


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


    public function changename()
    {
        $requiredFields = [ "name" ];
        $defMsg = Message::get(ERR_PROFILE_NAME);

        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields);
        if ($reqData === false) {
            throw new \Error($defMsg);
        }

        $this->begin();

        if (!$this->personMod->update($this->owner_id, $reqData)) {
            throw new \Error($defMsg);
        }

        $this->commit();

        $this->setMessage(Message::get(MSG_PROFILE_NAME));
        $this->ok($reqData);
    }


    public function changepass()
    {
        $requiredFields = [ "current", "new" ];
        $defMsg = Message::get(ERR_PROFILE_PASSWORD);

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

        if (!$this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"])) {
            throw new \Error($defMsg);
        }

        $this->commit();

        $this->setMessage(Message::get(MSG_PROFILE_PASSWORD));
        $this->ok();
    }


    public function reset()
    {
        $defMsg = Message::get(ERR_PROFILE_RESET);

        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $resetOptions = ["accounts", "persons", "transactions", "keepbalance", "importtpl", "importrules"];
        $request = $this->getRequestData();
        foreach ($resetOptions as $opt) {
            $request[$opt] = isset($request[$opt]);
        }

        $this->begin();

        if ($request["accounts"]) {
            $accMod = AccountModel::getInstance();
            if (!$accMod->reset(["deletePersons" => $request["persons"]])) {
                throw new \Error($defMsg);
            }
        }

        if ($request["persons"]) {
            if (!$this->personMod->reset()) {
                throw new \Error($defMsg);
            }
        }

        if ($request["transactions"]) {
            $transMod = TransactionModel::getInstance();
            if (!$transMod->reset($request["keepbalance"])) {
                throw new \Error($defMsg);
            }
        }

        if ($request["importtpl"]) {
            $tplModel = ImportTemplateModel::getInstance();
            if (!$tplModel->reset()) {
                throw new \Error($defMsg);
            }
        }

        if ($request["importrules"]) {
            $ruleMod = ImportRuleModel::getInstance();
            if (!$ruleMod->reset()) {
                throw new \Error($defMsg);
            }
        }

        $this->commit();

        $this->setMessage(Message::get(MSG_PROFILE_RESET));
        $this->ok();
    }


    public function del()
    {
        if (!$this->isPOST()) {
            throw new \Error("Invalid type of request");
        }

        $this->begin();

        if (!$this->uMod->del($this->user_id)) {
            throw new \Error(Message::get(ERR_PROFILE_DELETE));
        }

        $this->commit();

        Message::set(MSG_PROFILE_DELETE);
        $this->setMessage(Message::get(MSG_PROFILE_DELETE));
        $this->ok();
    }
}
