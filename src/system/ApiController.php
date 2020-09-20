<?php

namespace JezveMoney\Core;

use JezveMoney\App\Model\UserModel;


class ApiController extends Controller
{
	protected $response = NULL;
	protected $uMod = NULL;
	protected $user_id = 0;
	protected $owner_id = 0;
	public $authRequired = TRUE;


	protected function setMessage($msg = NULL)
	{
		if (!$this->response)
			throw new \Error("Invalid response object");

		if (is_null($msg))
			unset($this->response->msg);
		else
			$this->response->msg = $msg;
	}


	protected function setData($data = NULL)
	{
		if (!$this->response)
			throw new \Error("Invalid response object");

		if (is_null($data))
			unset($this->response->data);
		else
			$this->response->data = $data;
	}


	protected function fail($msg = NULL)
	{
		if (!$this->response)
			throw new \Error("Invalid response object");

		$this->response->fail($msg);
	}


	protected function ok($data = NULL)
	{
		if (!$this->response)
			throw new \Error("Invalid response object");

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
		$this->response = new ApiResponse;

		$this->uMod = UserModel::getInstance();
		$this->user_id = $this->uMod->check();
		if ($this->authRequired && $this->user_id == 0)
		{
			header("HTTP/1.1 401 Unauthorized", TRUE, 401);
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
		if ($this->isJsonContent())
			return $this->getJSONContent(TRUE);
		else
			return $_POST;
	}
}
