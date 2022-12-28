<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

class User extends TemplateController
{
    public function index()
    {
    }


    protected function fail($msg = null, $action = null)
    {
        if (!is_null($msg)) {
            Message::set($msg);
        }

        if ($action == "register") {
            setLocation(BASEURL . "register/");
        } else {
            setLocation(BASEURL . "login/");
        }
    }


    public function login()
    {
        if ($this->isPOST()) {
            $this->loginUser();
        }

        $this->template = new Template(VIEW_TPL_PATH . "Login.tpl");
        $data = [
            "titleString" => "Jezve Money | Log in"
        ];

        $this->cssArr[] = "LoginView.css";
        $this->jsArr[] = "LoginView.js";

        $this->render($data);
    }


    protected function loginUser()
    {
        $loginFields = ["login", "password"];

        if (!$this->isPOST()) {
            setLocation(BASEURL . "login/");
        }

        $reqData = checkFields($_POST, $loginFields);
        if (isset($_POST["remember"])) {
            $reqData["remember"] = true;
        }

        $result = false;
        try {
            $result = $this->uMod->login($reqData);
        } catch (\Error $e) {
            wlog("Login user error: " . $e->getMessage());
        }
        if (!$result) {
            $this->fail(ERR_LOGIN_FAIL);
        }

        Message::set(MSG_LOGIN);

        setLocation(BASEURL);
    }


    public function logout()
    {
        $this->uMod->logout();

        setLocation(BASEURL . "login/");
    }


    public function register()
    {
        if ($this->isPOST()) {
            $this->registerUser();
        }

        $this->template = new Template(VIEW_TPL_PATH . "Register.tpl");
        $data = [
            "titleString" => "Jezve Money | Registration"
        ];

        $this->cssArr[] = "RegisterView.css";
        $this->jsArr[] = "RegisterView.js";

        $this->render($data);
    }


    protected function registerUser()
    {
        $registerFields = ["login", "password", "name"];

        if (!$this->isPOST()) {
            setLocation(BASEURL);
        }

        $this->begin();

        $reqData = checkFields($_POST, $registerFields);

        $user_id = null;
        try {
            $user_id = $this->uMod->create($reqData);
        } catch (\Error $e) {
            wlog("Create user error: " . $e->getMessage());
        }
        if (!$user_id) {
            throw new \Error(ERR_REGISTER_FAIL);
        }

        $this->commit();

        Message::set(MSG_REGISTER);
        setLocation(BASEURL);
    }
}
