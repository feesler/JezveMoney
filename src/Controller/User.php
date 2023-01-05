<?php

namespace JezveMoney\App\Controller;

use JezveMoney\Core\TemplateController;
use JezveMoney\Core\Template;
use JezveMoney\Core\Message;

/**
 * User controller
 */
class User extends TemplateController
{
    public function index()
    {
    }

    /**
     * Controller error handler
     *
     * @param string|null $msg message string
     * @param string|null $action current action of controller
     */
    protected function fail(?string $msg = null, ?string $action = null)
    {
        if (!is_null($msg)) {
            Message::setError($msg);
        }

        if ($action == "register") {
            setLocation(BASEURL . "register/");
        } else {
            setLocation(BASEURL . "login/");
        }
    }

    /**
     * /login/ route handler
     * Renders login view
     */
    public function login()
    {
        if ($this->isPOST()) {
            $this->loginUser();
        }

        $this->template = new Template(VIEW_TPL_PATH . "Login.tpl");
        $data = [
            "titleString" => __("APP_NAME") . " | " . __("LOG_IN"),
        ];

        $this->cssArr[] = "LoginView.css";
        $this->jsArr[] = "LoginView.js";

        $this->render($data);
    }

    /**
     * Handles user login form submit
     */
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
            $this->fail(__("ERR_LOGIN_FAIL"));
        }

        setLocation(BASEURL);
    }

    /**
     * Handles user logout
     */
    public function logout()
    {
        $this->uMod->logout();

        setLocation(BASEURL . "login/");
    }

    /**
     * /register/ route handler
     * Renders registration view
     */
    public function register()
    {
        if ($this->isPOST()) {
            $this->registerUser();
        }

        $this->template = new Template(VIEW_TPL_PATH . "Register.tpl");
        $data = [
            "titleString" =>  __("APP_NAME") . " | " . __("REGISTRATION"),
        ];

        $this->cssArr[] = "RegisterView.css";
        $this->jsArr[] = "RegisterView.js";

        $this->render($data);
    }

    /**
     * Handles user registration form submit
     */
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
            throw new \Error(__("ERR_REGISTER_FAIL"));
        }

        $this->commit();

        Message::setSuccess(__("MSG_REGISTER"));
        setLocation(BASEURL);
    }
}
