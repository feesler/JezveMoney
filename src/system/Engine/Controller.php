<?php

namespace JezveMoney\Core;

abstract class Controller
{
    public $action = null;
    public $actionParam = null;
    protected $headers = null;


    abstract public function index();

    protected function onStart()
    {
    }


    public function runAction($action)
    {
        if (method_exists($this, $action)) {
            $this->$action();
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
        $rawData = file_get_contents('php://input');

        try {
            $json = JSON::decode($rawData, $asArray);
        } catch (\Exception $e) {
            wlog($e);
            $json = null;
        }

        return $json;
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
}
