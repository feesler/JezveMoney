<?php

class UserController extends Controller
{
	public function index()
	{
	}


	function fail($msg = NULL, $action = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		if ($action == "register")
			setLocation(BASEURL."register/");
		else
			setLocation(BASEURL."login/");
	}


	public function login()
	{
		global $u, $user_name, $user_id;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->loginUser();
			return;
		}

		$titleString = "Jezve Money | Log in";

		$cssArr = array("common.css", "user.css", "iconlink.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "main.js");

		include("./view/templates/login.tpl");
	}


	public function loginUser()
	{
		global $u;

		$defMsg = ERR_LOGIN_FAIL;

		if (!isset($_POST["login"]) || !isset($_POST["password"]))
			$this->fail($defMsg);

		if (!$u->login($_POST["login"], $_POST["password"]))
			$this->fail($defMsg);

		setMessage(MSG_LOGIN);

		setLocation(BASEURL);
	}


	public function logout()
	{
		global $u;

wlog("UwserController::logout()");

		$u->logout();

		setLocation(BASEURL."login/");
	}


	public function register()
	{
		global $u, $user_name, $user_id;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->registerUser();
			return;
		}

		$titleString = "Jezve Money | Registration";

		$cssArr = array("common.css", "user.css", "iconlink.css");
		$jsArr = array("es5-shim.min.js", "common.js", "app.js", "main.js");

		include("./view/templates/register.tpl");
	}


	public function registerUser()
	{
		global $u;

		$defMsg = ERR_REGISTER_FAIL;

		if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
			$this->fail($defMsg, "register");

		if (!$u->register($_POST["login"], $_POST["password"], $_POST["name"]))
			$this->fail($defMsg);

		setMessage(MSG_REGISTER);

		setLocation(BASEURL);
	}
}