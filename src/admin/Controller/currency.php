<?php

class CurrencyAdminController extends Controller
{
	public function __construct()
	{
		$this->model = new CurrencyModel();
	}


	public function index()
	{
		global $uMod, $user_name, $user_id;
		global $menuItems;

		$currArr = $this->model->getArray();

		$menuItems["curr"]["active"] = TRUE;

		$titleString = "Admin panel | Currency";

		$this->buildCSS();
		$this->cssAdmin[] = "currency.css";

		$this->jsArr[] = "currency.js";
		$this->jsAdmin[] = "currency.js";

		include("./view/templates/currency.tpl");
	}


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation(BASEURL."admin/currency/");
	}


	public function create()
	{
		$defMsg = ERR_CURRENCY_CREATE;

		if (!isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]))
			$this->fail($defMsg);

		$curr_format = (isset($_POST["curr_format"]) && $_POST["curr_format"] == "on") ? 1 : 0;

		if (!$this->model->create($_POST["curr_name"], $_POST["curr_sign"], $curr_format))
			$this->fail($defMsg);

		setMessage(MSG_CURRENCY_CREATE);

		setLocation(BASEURL."admin/currency/");
	}


	public function update()
	{
		$defMsg = ERR_CURRENCY_UPDATE;

		if (!isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]))
			$this->fail($defMsg);

		$curr_format = (isset($_POST["curr_format"]) && $_POST["curr_format"] == "on") ? 1 : 0;

		if (!isset($_POST["curr_id"]))
			$this->fail($defMsg);

		if (!$this->model->edit($_POST["curr_id"], $_POST["curr_name"], $_POST["curr_sign"], $curr_format))
			$this->fail($defMsg);

		setMessage(MSG_CURRENCY_UPDATE);

		setLocation(BASEURL."admin/currency/");
	}


	public function del()
	{
		$defMsg = ERR_CURRENCY_DELETE;

		if (!isset($_POST["curr_id"]))
			fail($defMsg);

		if (!$this->model->del($_POST["curr_id"]))
			fail($defMsg);

		setMessage(MSG_CURRENCY_DELETE);

		setLocation(BASEURL."admin/currency/");
	}
}