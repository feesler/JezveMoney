<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;

/**
 * Users API controller
 */
class User extends ApiListController
{
    protected $createRequiredFields = ["login", "password", "name", "access"];

    /**
     * Controller initialization
     */
    public function initAPI()
    {
        parent::initAPI();

        $this->model = $this->uMod;
        $this->createErrorMsg = __("users.errors.create");
        $this->updateErrorMsg = __("users.errors.update");
        $this->deleteErrorMsg = __("users.errors.delete");
    }


    /**
     * Login user
     */
    public function login()
    {
        $requiredFields = ["login", "password"];

        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields, true);
        if (!$this->uMod->login($reqData)) {
            throw new \Error(__("login.errorMessage"));
        }

        $this->ok();
    }

    /**
     * Logout user
     */
    public function logout()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $this->uMod->logout();

        $this->ok();
    }

    /**
     * Register new user
     */
    public function register()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        if ($this->user_id != 0) {
            throw new \Error("Need to log out first");
        }

        $request = $this->getRequestData();
        $request["access"] = 0;
        $reqData = checkFields($request, $this->createRequiredFields, true);

        $this->begin();

        $user_id = null;
        try {
            $user_id = $this->uMod->create($reqData);
        } catch (\Error $e) {
            wlog("Create user error: " . $e->getMessage());
        }
        if (!$user_id) {
            throw new \Error(__("registration.errorMessage"));
        }

        $this->commit();

        $this->ok();
    }

    /**
     * Returns list of users
     */
    public function getList()
    {
        $this->checkAdminAccess();
        parent::getList();
    }

    /**
     * Returns array of mandatory fields
     *
     * @param array $request
     *
     * @return array
     */
    protected function getExpectedFields(array $request)
    {
        return $this->createRequiredFields;
    }

    /**
     * Creates new user
     */
    public function create()
    {
        $this->checkAdminAccess();
        parent::create();
    }

    /**
     * Updates user
     */
    public function update()
    {
        $this->checkAdminAccess();
        parent::update();
    }

    /**
     * Changes user password
     */
    public function changePassword()
    {
        $this->checkAdminAccess();

        $requiredFields = ["id", "password"];
        $defMsg = __("profile.errors.changePassword");

        if (!$this->isPOST()) {
            throw new \Error(__("errors.invalidRequest"));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields, true);

        $this->begin();

        $uObj = $this->uMod->getItem($reqData["id"]);
        if (!$uObj) {
            throw new \Error($defMsg);
        }

        $result = false;
        try {
            $result = $this->uMod->setPassword($uObj->login, $reqData["password"]);
        } catch (\Error $e) {
            wlog("Set password error: " . $e->getMessage());
        }
        if (!$result) {
            throw new \Error($defMsg);
        }

        $this->commit();

        $this->setMessage(__("profile.passwordChangedMessage"));
        $this->ok();
    }

    /**
     * Removes user(s)
     */
    public function del()
    {
        $this->checkAdminAccess();
        parent::del();
    }
}
