<?php

namespace JezveMoney\Core;

class ApiResponse
{
    public $result = null;
    public $msg = null;


    public function render()
    {
        header("Content-Type: application/json; charset=utf-8");

        $output = JSON::encode($this);
        wlog("API response: " . $output);

        echo($output);
        exit;
    }


    public function fail($msg = null)
    {
        $this->result = "fail";
        if (!is_null($msg) && is_string($msg)) {
            $this->msg = $msg;
        }

        $this->render();
    }


    public function ok()
    {
        $this->result = "ok";

        $this->render();
    }
}
