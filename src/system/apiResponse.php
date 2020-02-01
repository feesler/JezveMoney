<?php

class apiResponse
{
	public function render()
	{
		header("Content-Type: application/json; charset=utf-8");

		return JSON::encode($this);
	}


	public function fail($msg = NULL)
	{
		$this->result = "fail";
		if (!is_null($msg) && is_string($msg))
			$this->msg = $msg;

		echo($this->render());
		exit();
	}


	public function ok()
	{
		$this->result = "ok";

		echo($this->render());
		exit();
	}
}
