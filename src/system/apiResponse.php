<?php

namespace JezveMoney\Core;


class apiResponse
{
	public $result = NULL;
	public $msg = NULL;


	public function render()
	{
		header("Content-Type: application/json; charset=utf-8");

		$output = JSON::encode($this);
		wlog("API response: ".$output);

		echo($output);
		exit;
	}


	public function fail($msg = NULL)
	{
		$this->result = "fail";
		if (!is_null($msg) && is_string($msg))
			$this->msg = $msg;

		$this->render();
	}


	public function ok()
	{
		$this->result = "ok";

		$this->render();
	}
}
