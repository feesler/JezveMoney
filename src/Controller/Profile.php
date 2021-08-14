<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;
use JezveMoney\Core\JSON;
use JezveMoney\App\Model\AccountModel;

class Profile extends TemplateController
{
    public function index()
    {
        $this->template = new Template(TPL_PATH . "profile.tpl");
        $data = [];

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            throw new \Error("User not found");
        }

        $data["user_login"] = $uObj->login;

        $pObj = $this->personMod->getItem($uObj->owner_id);
        if (!$pObj) {
            throw new \Error("Person not found");
        }

        $profileInfo = new \stdClass();
        $profileInfo->name = $pObj->name;
        $data["profileInfo"] = $profileInfo;

        $titleString = "Jezve Money | Profile";
        if ($this->action == "changeName") {
            $titleString .= " | Change name";
        } elseif ($this->action == "changePass") {
            $titleString .= " | Change password";
        }
        $data["titleString"] = $titleString;

        $viewData = [
            "profile" => $profileInfo
        ];

        if ($this->action == "changePass" || $this->action == "changeName") {
            $viewData["action"] = $this->action;
        }

        $data["viewData"] = JSON::encode($viewData);

        $this->cssArr[] = "ProfileView.css";
        $this->jsArr[] = "ProfileView.js";

        $this->render($data);
    }


    protected function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        setLocation(BASEURL . "profile/");
    }


    public function changeName()
    {
        $requiredFields = ["name"];

        if (!$this->isPOST()) {
            return $this->index();
        }

        $defMsg = ERR_PROFILE_NAME;

        $reqData = checkFields($_POST, $requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        $owner_id = $this->uMod->getOwner($this->user_id);

        if (!$this->personMod->update($owner_id, $reqData)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PROFILE_NAME);

        setLocation(BASEURL . "profile/");
    }


    public function changePass()
    {
        $requiredFields = ["current", "new"];

        if (!$this->isPOST()) {
            return $this->index();
        }

        $defMsg = ERR_PROFILE_PASSWORD;

        $reqData = checkFields($_POST, $requiredFields);
        if ($reqData === false) {
            $this->fail($defMsg);
        }

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            $this->fail($defMsg);
        }

        if (!$this->uMod->changePassword($uObj->login, $reqData["current"], $reqData["new"])) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PROFILE_PASSWORD);

        setLocation(BASEURL . "profile/");
    }


    public function reset()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "profile/");
        }

        $defMsg = ERR_ACCOUNTS_RESET;

        $accMod = AccountModel::getInstance();
        if (!$accMod->reset()) {
            $this->fail($defMsg);
        }

        Message::set(MSG_ACCOUNTS_RESET);

        setLocation(BASEURL . "profile/");
    }


    public function resetAll()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "profile/");
        }

        $defMsg = ERR_PROFILE_RESETALL;

        $accMod = AccountModel::getInstance();
        if (!$accMod->reset()) {
            $this->fail($defMsg);
        }

        if (!$this->personMod->reset()) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PROFILE_RESETALL);

        setLocation(BASEURL . "profile/");
    }


    public function del()
    {
        if (!$this->isPOST()) {
            setLocation(BASEURL . "profile/");
        }

        $defMsg = ERR_PROFILE_DELETE;

        if (!$this->uMod->del($this->user_id)) {
            $this->fail($defMsg);
        }

        Message::set(MSG_PROFILE_DELETE);

        setLocation(BASEURL . "login/");
    }
}
