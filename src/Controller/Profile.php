<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

class Profile extends TemplateController
{
    public function index()
    {
        $this->template = new Template(VIEW_TPL_PATH . "Profile.tpl");
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

        $profileInfo = $this->getProfileData();
        $data["profileInfo"] = $profileInfo;

        $titleString = "Jezve Money | Profile";
        if ($this->action == "changeName") {
            $titleString .= " | Change name";
        } elseif ($this->action == "changePass") {
            $titleString .= " | Change password";
        }
        $data["titleString"] = $titleString;

        $viewProps = [];
        if ($this->action == "changePass" || $this->action == "changeName") {
            $viewProps["action"] = $this->action;
        }

        $data["appProps"] = [
            "profile" => $profileInfo,
            "view" => $viewProps,
        ];

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
}
