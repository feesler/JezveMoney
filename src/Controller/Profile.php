<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

class Profile extends TemplateController
{
    public function index()
    {
        $availActions = ["name", "password", "reset"];

        $this->template = new Template(VIEW_TPL_PATH . "Profile.tpl");
        $data = [];

        $uObj = $this->uMod->getItem($this->user_id);
        if (!$uObj) {
            throw new \Error(__("ERR_USER_NOT_FOUND"));
        }

        $data["user_login"] = $uObj->login;

        $pObj = $this->personMod->getItem($uObj->owner_id);
        if (!$pObj) {
            throw new \Error(__("ERR_PERSON_NOT_FOUND"));
        }

        $profileInfo = $this->getProfileData();
        $data["profileInfo"] = $profileInfo;

        $titleString = __("APP_NAME") . " | " . __("PROFILE");
        if ($this->action == "name") {
            $titleString .= " | " . __("PROFILE_CHANGE_NAME");
        } elseif ($this->action == "changePass") {
            $titleString .= " | " . __("PROFILE_CHANGE_PASS");
        } elseif ($this->action == "reset") {
            $titleString .= " | " . __("PROFILE_RESET_DATA");
        }
        $data["titleString"] = $titleString;

        $viewProps = [];
        if (in_array($this->action, $availActions)) {
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


    public function name()
    {
        $this->index();
    }


    public function password()
    {
        $this->index();
    }


    public function reset()
    {
        $this->index();
    }


    protected function fail($msg = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        setLocation(BASEURL . "profile/");
    }
}
