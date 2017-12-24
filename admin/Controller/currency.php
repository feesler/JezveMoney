<?php

class CurrencyController extends Controller
{
	public function index()
	{
		global $uMod, $user_name, $user_id;
		global $menuItems;

		$currArr = CurrencyModel::getArray();

		$menuItems["curr"]["active"] = TRUE;

		$titleString = "Admin panel | Currency";

		$this->css->libs[] = "iconlink.css";
		$this->buildCSS();
		$this->cssAdmin = array("admin.css", "currency.css");

		$this->jsArr[] = "currency.js";
		$this->jsAdmin[] = "currency.js";

		include("./view/templates/currency.tpl");
	}


	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("../admin/currency.php");
	}


	public function create()
	{
		$defMsg = ERR_CURRENCY_CREATE;

		if (!isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]))
			$this->fail($defMsg);

		$curr_format = (isset($_POST["curr_format"]) && $_POST["curr_format"] == "on") ? 1 : 0;

		if (!CurrencyModel::create($_POST["curr_name"], $_POST["curr_sign"], $curr_format))
			$this->fail($defMsg);

		setMessage(MSG_CURRENCY_CREATE);

		setLocation(BASEURL."admin/currency.php");
	}


	public function update()
	{
		$defMsg = ERR_CURRENCY_UPDATE;

		if (!isset($_POST["curr_name"]) || !isset($_POST["curr_sign"]))
			$this->fail($defMsg);

		$curr_format = (isset($_POST["curr_format"]) && $_POST["curr_format"] == "on") ? 1 : 0;

		if (!isset($_POST["curr_id"]))
			$this->fail($defMsg);

		if (!CurrencyModel::edit($_POST["curr_id"], $_POST["curr_name"], $_POST["curr_sign"], $curr_format))
			$this->fail($defMsg);

		setMessage(MSG_CURRENCY_UPDATE);

		setLocation(BASEURL."admin/currency.php");
	}


	public function del()
	{
		$defMsg = ERR_CURRENCY_DELETE;

		if (!isset($_POST["curr_id"]))
			fail($defMsg);

		if (!CurrencyModel::del($_POST["curr_id"]))
			fail($defMsg);

		setMessage(MSG_CURRENCY_DELETE);

		setLocation(BASEURL."admin/currency.php");
	}
}