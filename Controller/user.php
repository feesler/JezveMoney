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
		global $uMod, $user_name, $user_id;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->loginUser();
			return;
		}

		$titleString = "Jezve Money | Log in";

		$this->css->page[] = "user.css";
		$this->buildCSS();
		array_push($this->jsArr, "main.js");

		include("./view/templates/login.tpl");
	}


	public function loginUser()
	{
		global $uMod;

		$defMsg = ERR_LOGIN_FAIL;

		if (!isset($_POST["login"]) || !isset($_POST["password"]))
			$this->fail($defMsg);

		if (!$uMod->login($_POST["login"], $_POST["password"]))
			$this->fail($defMsg);

		setMessage(MSG_LOGIN);

		setLocation(BASEURL);
	}


	public function logout()
	{
		global $uMod;

wlog("UserController::logout()");

		$uMod->logout();

		setLocation(BASEURL."login/");
	}


	public function register()
	{
		global $uMod, $user_name, $user_id;

		if ($_SERVER["REQUEST_METHOD"] == "POST")
		{
			$this->registerUser();
			return;
		}

		$titleString = "Jezve Money | Registration";

		$this->css->page[] = "user.css";
		$this->buildCSS();
		array_push($this->jsArr, "main.js");

		include("./view/templates/register.tpl");
	}


	public function registerUser()
	{
		global $uMod;

		$defMsg = ERR_REGISTER_FAIL;

		if (!isset($_POST["login"]) || !isset($_POST["password"]) || !isset($_POST["name"]))
			$this->fail($defMsg, "register");

		if (!$uMod->register($_POST["login"], $_POST["password"], $_POST["name"]))
			$this->fail($defMsg);

		setMessage(MSG_REGISTER);

		setLocation(BASEURL);
	}
}