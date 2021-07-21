<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
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

        $titleString = "Jezve Money | Log in";

        $this->cssArr[] = "LoginView.css";
        $this->buildCSS();
        $this->jsArr[] = "LoginView.js";

        include(TPL_PATH . "login.tpl");
    }


    protected function loginUser()
    {
        $loginFields = ["login", "password"];

        if (!$this->isPOST()) {
            setLocation(BASEURL . "login/");
        }

        $reqData = checkFields($_POST, $loginFields);
        if (!$this->uMod->login($reqData)) {
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

        $titleString = "Jezve Money | Registration";

        $this->cssArr[] = "RegisterView.css";
        $this->buildCSS();
        $this->jsArr[] = "RegisterView.js";

        include(TPL_PATH . "register.tpl");
    }


    protected function registerUser()
    {
        $registerFields = ["login", "password", "name"];

        if (!$this->isPOST()) {
            setLocation(BASEURL);
        }

        $reqData = checkFields($_POST, $registerFields);
        if (!$this->uMod->create($reqData)) {
            $this->fail(ERR_REGISTER_FAIL);
        }

        Message::set(MSG_REGISTER);

        setLocation(BASEURL);
    }
}
