<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\UserModel;

class ApiController extends Controller
{
    protected $response = null;
    protected $uMod = null;
    protected $user_id = 0;
    protected $owner_id = 0;
    public $authRequired = true;


    protected function setMessage($msg = null)
    {
        if (!$this->response) {
            throw new \Error("Invalid response object");
        }

        if (is_null($msg)) {
            unset($this->response->msg);
        } else {
            $this->response->msg = $msg;
        }
    }


    protected function setData($data = null)
    {
        if (!$this->response) {
            throw new \Error("Invalid response object");
        }

        if (is_null($data)) {
            unset($this->response->data);
        } else {
            $this->response->data = $data;
        }
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


    public function __call($method, $parameters)
    {
        wlog("call " . static::class . "::" . $method . "()");

        if (!method_exists($this, $method)) {
            header("HTTP/1.1 400 Bad Request", true, 400);
            $this->fail("Access denied");
        }

        if (!UserModel::isAdminUser()) {
            header("HTTP/1.1 403 Forbidden", true, 403);
            $this->fail("Access denied");
        }

        return call_user_func_array([ $this, $method ], $parameters);
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
            $this->fail("Access denied");
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
        } else {
            return $_POST;
        }
    }
}
