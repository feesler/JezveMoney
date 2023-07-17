<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\UserModel;

/**
 * Base API controller class
 */
class ApiController extends Controller
{
    protected $response = null;
    protected $uMod = null;
    protected $user_id = 0;
    protected $owner_id = 0;
    public $authRequired = true;

    /**
     * Runs specified action on controller instance
     *
     * @param string $action controller method to run
     */
    public function runAction(string $action)
    {
        if (!method_exists($this, $action)) {
            return false;
        }

        try {
            $this->$action();
            return true;
        } catch (\Error $e) {
            $this->fail($e->getMessage());
            return false;
        }
    }


    protected function setMessage($msg = null)
    {
        if (!$this->response) {
            throw new \Error("Invalid response object");
        }

        $this->response->setMessage($msg);
    }


    protected function setData($data = null)
    {
        if (!$this->response) {
            throw new \Error("Invalid response object");
        }

        $this->response->setData($data);
    }


    protected function fail($msg = null)
    {
        if (!$this->response) {
            throw new \Error("Invalid response object");
        }

        $this->response->fail($msg);
    }


    protected function ok($data = null)
    {
        if (!$this->response) {
            throw new \Error("Invalid response object");
        }

        if (!is_null($data)) {
            $this->setData($data);
        }

        $this->response->ok();
    }

    protected function checkAdminAccess()
    {
        if (!UserModel::isAdminUser()) {
            header("HTTP/1.1 403 Forbidden", true, 403);
            throw new \Error("Access denied");
        }
    }


    public function __call($method, $parameters)
    {
        if (!method_exists($this, $method)) {
            header("HTTP/1.1 400 Bad Request", true, 400);
            throw new \Error("Access denied");
        }

        return call_user_func_array([$this, $method], $parameters);
    }


    // API controller may have no index entry
    public function index()
    {
    }


    // Common API initialization
    public function initAPI()
    {
        $this->response = new ApiResponse();

        $this->uMod = UserModel::getInstance();
        $this->user_id = $this->uMod->check();
        if ($this->authRequired && $this->user_id == 0) {
            header("HTTP/1.1 401 Unauthorized", true, 401);
            throw new \Error("Access denied");
        }

        $this->owner_id = $this->uMod->getOwner();
    }


    protected function isJsonContent()
    {
        $contentType = $this->getHeader("Content-Type");
        return ($contentType && $contentType == "application/json");
    }


    protected function getRequestData()
    {
        if ($this->isJsonContent()) {
            return $this->getJSONContent(true);
        } elseif ($this->isPOST()) {
            return $_POST;
        } else {
            return $_GET;
        }
    }
}
