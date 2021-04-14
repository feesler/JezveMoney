<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiController;
use JezveMoney\Core\Message;

class User extends ApiController
{
    protected $createRequiredFields = [ "login", "password", "name" ];


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
        $reqData = checkFields($request, $this->createRequiredFields);
        if ($reqData === false) {
            throw new \Error("Invalid request data");
        }

        if (!$this->uMod->create($reqData)) {
            throw new \Error(Message::get(ERR_REGISTER_FAIL));
        }

        $this->ok();
    }


    protected function getList()
    {
        $data = $this->uMod->getData();
        $this->ok($data);
    }


    protected function create()
    {
        $defMsg = Message::get(ERR_USER_CREATE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $this->createRequiredFields);
        if ($reqData === false) {
            throw new \Error($defMsg);
        }

        $reqData["access"] = isset($request["access"]) ? intval($request["access"]) : 0;

        $new_user_id = $this->uMod->create($reqData);
        if (!$new_user_id) {
            throw new \Error($defMsg);
        }

        $this->setMessage(Message::get(MSG_USER_CREATE));
        $this->ok([ "id" => $new_user_id ]);
    }


    protected function update()
    {
        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $request = $this->getRequestData();
        if (!isset($request["id"])) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        $reqData = checkFields($request, $this->createRequiredFields);
        if ($reqData === false) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST_DATA));
        }

        if (isset($request["access"])) {
            $reqData["access"] = intval($request["access"]);
        }

        $updateRes = $this->uMod->update($request["id"], $reqData);
        if (!$updateRes) {
            throw new \Error(Message::get(ERR_USER_UPDATE));
        }

        $this->setMessage(Message::get(MSG_USER_UPDATE));
        $this->ok();
    }


    protected function changePassword()
    {
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

        $uObj = $this->uMod->getItem($reqData["id"]);
        if (!$uObj) {
            throw new \Error($defMsg);
        }

        if (!$this->uMod->setPassword($uObj->login, $reqData["password"])) {
            throw new \Error($defMsg);
        }

        $this->setMessage(Message::get(MSG_PROFILE_PASSWORD));
        $this->ok();
    }


    protected function del()
    {
        $defMsg = Message::get(ERR_USER_DELETE);

        if (!$this->isPOST()) {
            throw new \Error(Message::get(ERR_INVALID_REQUEST));
        }

        $ids = $this->getRequestedIds(true, $this->isJsonContent());
        if (is_null($ids) || !is_array($ids) || !count($ids)) {
            throw new \Error("No account specified");
        }

        if (!$this->uMod->del($ids)) {
            throw new \Error($defMsg);
        }

        $this->setMessage(Message::get(MSG_USER_DELETE));
        $this->ok();
    }
}
