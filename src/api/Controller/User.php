<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;

class User extends ApiListController
{
    protected $createRequiredFields = [ "login", "password", "name", "access" ];

    public function initAPI()
    {
        parent::initAPI();

        $this->model = $this->uMod;
        $this->createErrorMsg = Message::get(ERR_USER_CREATE);
        $this->updateErrorMsg = Message::get(ERR_USER_UPDATE);
        $this->deleteErrorMsg = Message::get(ERR_USER_DELETE);
    }


    public function login()
    {
        $requiredFields = [ "login", "password" ];

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields);
        if (!$this->uMod->login($reqData)) {
            throw new \Error(Message::get(ERR_LOGIN_FAIL));
        }

        $this->ok();
    }


    public function logout()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $this->uMod->logout();

        $this->ok();
    }


    public function register()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        if ($this->user_id != 0) {
            throw new \Error("Need to log out first");
        }

        $request = $this->getRequestData();
        $request["access"] = 0;
        $reqData = checkFields($request, $this->createRequiredFields);
        if ($reqData === false) {
            throw new \Error("Invalid request data");
        }

        $this->begin();

        if (!$this->uMod->create($reqData)) {
            throw new \Error(Message::get(ERR_REGISTER_FAIL));
        }

        $this->commit();

        $this->ok();
    }


    public function getList()
    {
        $this->checkAdminAccess();
        parent::getList();
    }


    protected function getExpectedFields($request)
    {
        return $this->createRequiredFields;
    }


    public function create()
    {
        $this->checkAdminAccess();
        parent::create();
    }


    public function update()
    {
        $this->checkAdminAccess();
        parent::update();
    }


    public function changePassword()
    {
        $this->checkAdminAccess();

        $requiredFields = [ "id", "password" ];
        $defMsg = Message::get(ERR_PROFILE_PASSWORD);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $this->begin();

        $uObj = $this->uMod->getItem($reqData["id"]);
        if (!$uObj) {
            throw new \Error($defMsg);
        }

        if (!$this->uMod->setPassword($uObj->login, $reqData["password"])) {
            throw new \Error($defMsg);
        }

        $this->commit();

        $this->setMessage(Message::get(MSG_PROFILE_PASSWORD));
        $this->ok();
    }


    public function del()
    {
        $this->checkAdminAccess();
        parent::del();
    }
}
