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
        $this->createErrorMsg = __("ERR_USER_CREATE");
        $this->updateErrorMsg = __("ERR_USER_UPDATE");
        $this->deleteErrorMsg = __("ERR_USER_DELETE");
    }


    /**
     * Login user
     */
    public function login()
    {
        $requiredFields = ["login", "password"];

        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
        }

        $request = $this->getRequestData();
        $reqData = checkFields($request, $requiredFields, true);
        if (!$this->uMod->login($reqData)) {
            throw new \Error(__("ERR_LOGIN_FAIL"));
        }

        $this->ok();
    }

    /**
     * Logout user
     */
    public function logout()
    {
        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
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
            throw new \Error(__("ERR_INVALID_REQUEST"));
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
            throw new \Error(__("ERR_REGISTER_FAIL"));
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
        $defMsg = __("ERR_PROFILE_PASSWORD");

        if (!$this->isPOST()) {
            throw new \Error(__("ERR_INVALID_REQUEST"));
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

        $this->setMessage(__("MSG_PROFILE_PASSWORD"));
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
