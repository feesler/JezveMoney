<?php

namespace JezveMoney\Core;

/**
 * API response class
 */
class ApiResponse
{
    public $response = null;

    public function __construct()
    {
        $this->response = new \stdClass();
    }

    /**
     * Renders JSON to the output and exit
     */
    public function render()
    {
        header("Content-Type: application/json; charset=utf-8");

        $output = JSON::encode($this->response);
        wlog("API response: " . $output);

        echo ($output);
    }

    /**
     * Renders failed response
     *
     * @param string|null $msg message string
     */
    public function fail(?string $msg = null)
    {
        $this->response->result = "fail";
        if (!is_null($msg) && is_string($msg)) {
            $this->response->msg = $msg;
        }

        $this->render();
    }

    /**
     * Renders successfull response
     */
    public function ok()
    {
        $this->response->result = "ok";

        $this->render();
    }

    /**
     * Sets response message if value is not null
     * Unsets response message if value is null
     *
     * @param string|null $msg message string
     */
    public function setMessage(?string $msg = null)
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

    /**
     * Sets response data if value is not null
     * Unsets response data if value is null
     *
     * @param mixed|null $data response data
     */
    public function setData(mixed $data = null)
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
}
