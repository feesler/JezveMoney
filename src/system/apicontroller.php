<?php

class ApiController extends Controller
{
	protected function setMessage($msg = NULL)
	{
		if (is_null($msg))
			unset($this->response->msg);
		else
			$this->response->msg = $msg;
	}


	protected function setData($data = NULL)
	{
		if (is_null($data))
			unset($this->response->data);
		else
			$this->response->data = $data;
	}


	protected function fail($msg = NULL)
	{
		$this->response->fail($msg);
	}


	protected function ok($data = NULL)
	{
		if (!is_null($data))
			$this->setData($data);

		$this->response->ok();
	}


	public function __call($method, $parameters)
	{
		wlog("call ".static::class."::".$method."()");

		if (!method_exists($this, $method))
		{
			header("HTTP/1.1 400 Bad Request", TRUE, 400);
			$this->fail("Access denied");
		}

		if (!UserModel::isAdminUser())
		{
			header("HTTP/1.1 403 Forbidden", TRUE, 403);
			$this->fail("Access denied");
		}

		return call_user_func_array([ $this, $method ], $parameters);
	}


	// API controller may have no index entry
	public function index(){}


	// Common API initialization
	public function initAPI()
	{
		$this->response = new apiResponse;

		$this->uMod = UserModel::getInstance();
		$this->user_id = $this->uMod->check();
		if ($this->authRequired && $this->user_id == 0)
		{
			header("HTTP/1.1 401 Unauthorized", TRUE, 401);
			$this->fail("Access denied");
		}

		$this->owner_id = $this->uMod->getOwner();
	}
}
