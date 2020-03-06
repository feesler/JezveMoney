<?php

class ApiController extends Controller
{
	public function __call($method, $parameters)
	{
		wlog("call ".static::class."::".$method."()");

		if (!method_exists($this, $method))
		{
			header("HTTP/1.1 400 Bad Request", TRUE, 400);
			$res = new apiResponse;
			$res->fail("Access denied");
		}

		if (!UserModel::isAdminUser())
		{
			header("HTTP/1.1 403 Forbidden", TRUE, 403);
			$res->fail("Access denied");
		}

		return call_user_func_array([ $this, $method ], $parameters);
	}


	// API controller may have no index entry
	public function index(){}


	// Common API initialization
	public function initAPI()
	{
		$this->uMod = UserModel::getInstance();
		$this->user_id = $this->uMod->check();
		if ($this->authRequired && $this->user_id == 0)
		{
			header("HTTP/1.1 401 Unauthorized", TRUE, 401);
			$res = new apiResponse;
			$res->fail("Access denied");
		}
	}
}
