<?php

namespace JezveMoney\Core;

abstract class Controller
{
    public $action = null;
    public $actionParam = null;
    protected $headers = null;
    public $transactionRunning = false;


    abstract public function index();

    protected function onStart()
    {
    }


    protected function fail($msg = null)
    {
    }


    public function runAction($action)
    {
        if (!method_exists($this, $action)) {
            return;
        }

        try {
            $this->$action();
        } catch (\Error $e) {
            $message = $e->getMessage();
            wlog($message);
            $this->rollback();
            $this->fail($message);
        }
    }


    // Check current request is POST
    protected function isPOST()
    {
        return ($_SERVER["REQUEST_METHOD"] == "POST");
    }


    protected function getHeader($name)
    {
        if (is_empty($name)) {
            return null;
        }

        if (is_null($this->headers)) {
            $this->headers = [];
            foreach (getallheaders() as $header => $value) {
                $this->headers[strtolower($header)] = $value;
            }
        }

        $lname = strtolower($name);
        if (isset($this->headers[$lname])) {
            return $this->headers[$lname];
        }

        return null;
    }


    // Check request is AJAX
    protected function isAJAX()
    {
        $xRequestedWith = $this->getHeader("X-Requested-With");

        return ($xRequestedWith && $xRequestedWith == "XMLHttpRequest");
    }


    // Obtain input of request and try to decode it as JSON
    protected function getJSONContent($asArray = false)
    {
        return JSON::fromFile('php://input', $asArray);
    }


    // Obtain requested ids from actionParam of from GET id parameter and return array of integers
    protected function getRequestedIds($isPOST = false, $isJSON = false)
    {
        if ($isPOST) {
            $httpSrc = ($isJSON) ? $this->getJSONContent(true) : $_POST;
        } else {
            $httpSrc = $_GET;
        }

        if (is_null($this->actionParam) && !isset($httpSrc["id"])) {
            return null;
        }

        $res = [];

        if (isset($httpSrc["id"])) {
            if (is_array($httpSrc["id"])) {
                foreach ($httpSrc["id"] as $val) {
                    $val = intval($val);
                    if ($val) {
                        $res[] = $val;
                    }
                }
            } else {
                $val = intval($httpSrc["id"]);
                if ($val) {
                    $res[] = $val;
                }
            }
        } else {
            $res[] = intval($this->actionParam);
        }

        return $res;
    }


    // Requests Model to start database transaction
    protected function begin()
    {
        if (!Model::begin()) {
            throw new \Error("Failed to start SQL transaction");
        }

        $this->transactionRunning = true;
    }


    // Requests Model to commit current database transaction
    protected function commit()
    {
        if (!$this->transactionRunning) {
            return;
        }

        if (!Model::commit()) {
            throw new \Error("Failed to commit SQL transaction");
        }
    }


    // Requests Model to rollback current database transaction
    protected function rollback()
    {
        if (!$this->transactionRunning) {
            return;
        }

        if (!Model::rollback()) {
            throw new \Error("Failed to rollback SQL transaction");
        }
    }
}
