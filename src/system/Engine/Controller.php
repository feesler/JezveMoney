<?php

namespace JezveMoney\Core;

/**
 * Base controler class
 */
abstract class Controller
{
    public $action = null;
    public $actionParam = null;
    protected $headers = null;
    public $transactionRunning = false;


    abstract public function index();

    /**
     * Controller initialization
     */
    protected function onStart()
    {
    }

    /**
     * Error handler
     *
     * @param string|null $msg
     */
    protected function fail(?string $msg = null)
    {
    }

    /**
     * Runs specified action on controller instance
     *
     * @param string $action controller method to run
     */
    public function runAction(string $action)
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

    /**
     * Returns true if current request is POST
     *
     * @return bool
     */
    protected function isPOST()
    {
        return ($_SERVER["REQUEST_METHOD"] == "POST");
    }

    /**
     * Returns value of specified HTTP header or null if header not found
     *
     * @param string $name
     *
     * @return string|null
     */
    protected function getHeader(string $name)
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

    /**
     * Returns true if current request is AJAX
     *
     * @return bool
     */
    protected function isAJAX()
    {
        $xRequestedWith = $this->getHeader("X-Requested-With");

        return ($xRequestedWith && $xRequestedWith == "XMLHttpRequest");
    }

    /**
     * Obtains input of request and try to decode it as JSON
     *
     * @param bool $asArray convert result object to array
     *
     * @return array|object
     */
    protected function getJSONContent(bool $asArray = false)
    {
        return JSON::fromFile('php://input', $asArray);
    }

    /**
     * Obtains requested ids from actionParam of from GET id parameter and return array of integers
     *
     * @param bool $isPOST
     * @param bool $isJSON
     *
     * @return int[]|null
     */
    protected function getRequestedIds(bool $isPOST = false, bool $isJSON = false)
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
            $ids = asArray($httpSrc["id"]);
            foreach ($ids as $val) {
                $val = intval($val);
                if ($val) {
                    $res[] = $val;
                }
            }
        } else {
            $res[] = intval($this->actionParam);
        }

        return $res;
    }

    /**
     * Requests Model to start database transaction
     */
    protected function begin()
    {
        if (!Model::begin()) {
            throw new \Error("Failed to start SQL transaction");
        }

        $this->transactionRunning = true;
    }

    /**
     * Requests Model to commit current database transaction
     */
    protected function commit()
    {
        if (!$this->transactionRunning) {
            return;
        }

        if (!Model::commit()) {
            throw new \Error("Failed to commit SQL transaction");
        }
    }

    /**
     * Requests Model to rollback current database transaction
     */
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
