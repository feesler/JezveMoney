<?php

class ApiController extends Controller
{
	// API controller may have no index entry
	public function index(){}


	// Common API initialization
	public function checkAuth()
	{
		$this->uMod = new UserModel();
		$user_id = $this->uMod->check();
		if ($user_id == 0)
		{
			header("HTTP/1.1 401 Unauthorized", TRUE, 401);
			$res = new apiResponse;
			$res->fail("Access denied");
		}
	}
}
