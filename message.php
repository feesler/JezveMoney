<?php

	$msgCounter = 0;

	// Define new message constant
	function addMessage($constName)
	{
		global $msgCounter;

		define($constName, $msgCounter, TRUE);
		$msgCounter++;
	}


	// Type of messages
	define("MSG_TYPE_NONE", 0, TRUE);
	define("MSG_TYPE_SUCCESS", 1, TRUE);
	define("MSG_TYPE_ERROR", 2, TRUE);


	addMessage("MSG_NONE");

	addMessage("MSG_REGISTER");
	addMessage("ERR_REGISTER_FAIL");
	addMessage("MSG_LOGIN");
	addMessage("ERR_LOGIN_FAIL");
	addMessage("MSG_PROFILE_NAME");
	addMessage("ERR_PROFILE_NAME");
	addMessage("MSG_PROFILE_PASSWORD");
	addMessage("ERR_PROFILE_PASSWORD");
	addMessage("MSG_PROFILE_RESETALL");
	addMessage("ERR_PROFILE_RESETALL");

	addMessage("MSG_ACCOUNT_CREATE");
	addMessage("ERR_ACCOUNT_CREATE");
	addMessage("MSG_ACCOUNT_UPDATE");
	addMessage("ERR_ACCOUNT_UPDATE");
	addMessage("MSG_ACCOUNT_DELETE");
	addMessage("ERR_ACCOUNT_DELETE");
	addMessage("MSG_ACCOUNTS_RESET");
	addMessage("ERR_ACCOUNTS_RESET");

	addMessage("MSG_CURRENCY_CREATE");
	addMessage("ERR_CURRENCY_CREATE");
	addMessage("MSG_CURRENCY_DELETE");
	addMessage("ERR_CURRENCY_DELETE");

	addMessage("MSG_PERSON_CREATE");
	addMessage("ERR_PERSON_CREATE");
	addMessage("MSG_PERSON_UPDATE");
	addMessage("ERR_PERSON_UPDATE");
	addMessage("MSG_PERSON_DELETE");
	addMessage("ERR_PERSON_DELETE");

	addMessage("MSG_TRANS_CREATE");
	addMessage("ERR_TRANS_CREATE");
	addMessage("MSG_TRANS_UPDATE");
	addMessage("ERR_TRANS_UPDATE");
	addMessage("MSG_TRANS_DELETE");
	addMessage("ERR_TRANS_DELETE");

	addMessage("MSG_DEBT_CREATE");
	addMessage("ERR_DEBT_CREATE");
	addMessage("MSG_DEBT_UPDATE");
	addMessage("ERR_DEBT_UPDATE");


	$msgArray = array(
		MSG_REGISTER => array(MSG_TYPE_NONE),
		ERR_REGISTER_FAIL => array(MSG_TYPE_ERROR, "Fail to register."),
		MSG_LOGIN => array(MSG_TYPE_NONE),
		ERR_LOGIN_FAIL => array(MSG_TYPE_ERROR, "Wrong login/password. Please check it and try to retype again."),
		MSG_PROFILE_NAME => array(MSG_TYPE_SUCCESS, "User name successfully updated."),
		ERR_PROFILE_NAME => array(MSG_TYPE_ERROR, "Fail to update user name."),
		MSG_PROFILE_PASSWORD => array(MSG_TYPE_SUCCESS, "Password successfully updated."),
		ERR_PROFILE_PASSWORD => array(MSG_TYPE_ERROR, "Fail to update password."),
		MSG_PROFILE_RESETALL => array(MSG_TYPE_SUCCESS, "All data successfully reseted."),
		ERR_PROFILE_RESETALL => array(MSG_TYPE_ERROR, "Fail to reset."),

		MSG_ACCOUNT_CREATE => array(MSG_TYPE_NONE),
		ERR_ACCOUNT_CREATE => array(MSG_TYPE_ERROR, "Fail to create new account."),
		MSG_ACCOUNT_UPDATE => array(MSG_TYPE_NONE),
		ERR_ACCOUNT_UPDATE => array(MSG_TYPE_ERROR, "Fail to update account."),
		MSG_ACCOUNT_DELETE => array(MSG_TYPE_NONE),
		ERR_ACCOUNT_DELETE => array(MSG_TYPE_ERROR, "Fail to delete account."),
		MSG_ACCOUNTS_RESET => array(MSG_TYPE_SUCCESS, "Accounts successfully reseted"),
		ERR_ACCOUNTS_RESET => array(MSG_TYPE_ERROR, "Fail to reset accounts."),

		MSG_CURRENCY_CREATE => array(MSG_TYPE_SUCCESS, "Currency successfully created."),
		ERR_CURRENCY_CREATE => array(MSG_TYPE_ERROR, "Fail to create new currency."),
		MSG_CURRENCY_UPDATE => array(MSG_TYPE_SUCCESS, "Currency successfully updated."),
		ERR_CURRENCY_UPDATE => array(MSG_TYPE_ERROR, "Fail to update currency."),
		MSG_CURRENCY_DELETE => array(MSG_TYPE_SUCCESS, "Currency successfully deleted."),
		ERR_CURRENCY_DELETE => array(MSG_TYPE_ERROR, "Fail to delete currency."),

		MSG_PERSON_CREATE => array(MSG_TYPE_NONE),
		ERR_PERSON_CREATE => array(MSG_TYPE_ERROR, "Fail to create new person."),
		ERR_PERSON_CREATE_EXIST => array(MSG_TYPE_ERROR, "Fail to create new person. Person with same name already exist."),
		MSG_PERSON_UPDATE => array(MSG_TYPE_NONE),
		ERR_PERSON_UPDATE => array(MSG_TYPE_ERROR, "Fail to update person."),
		ERR_PERSON_UPDATE_EXIST => array(MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist."),
		MSG_PERSON_DELETE => array(MSG_TYPE_NONE),
		ERR_PERSON_DELETE => array(MSG_TYPE_ERROR, "Fail to delete person."),

		MSG_TRANS_CREATE => array(MSG_TYPE_NONE),
		ERR_TRANS_CREATE => array(MSG_TYPE_ERROR, "Fail to create new transaction."),
		MSG_TRANS_UPDATE => array(MSG_TYPE_NONE),
		ERR_TRANS_UPDATE => array(MSG_TYPE_ERROR, "Fail to update transaction."),
		MSG_TRANS_DELETE => array(MSG_TYPE_NONE),
		ERR_TRANS_DELETE => array(MSG_TYPE_ERROR, "Fail to delete transaction."),

		MSG_DEBT_CREATE => array(MSG_TYPE_NONE),
		ERR_DEBT_CREATE => array(MSG_TYPE_ERROR, "Fail to create new debt."),
		MSG_DEBT_UPDATE => array(MSG_TYPE_NONE),
		ERR_DEBT_UPDATE => array(MSG_TYPE_ERROR, "Fail to update debt."),
	);


	// Try to set message
	function setMessage($msg_id)
	{
		global $msgArray;

		sessionStart();

		if (!isset($msgArray[$msg_id]))
			return FALSE;

		$_SESSION["msg"] = $msg_id;

		return TRUE;
	}


	// Check message and show it if available
	function checkMessage()
	{
		global $msgArray;

		sessionStart();

		if (!isset($_SESSION["msg"]))
			return;

		$msg_id = intval($_SESSION["msg"]);
		if ($msg_id == MSG_NONE || !isset($msgArray[$msg_id]))
			return;

		$msgParam = $msgArray[$msg_id];
		$msgType = $msgParam[0];
		if ($msgType == MSG_TYPE_NONE)
		{
			$_SESSION["msg"] = MSG_NONE;
			return;
		}

		$msgMessage = $msgParam[1];

		$msgClass = "msg";
		if ($msgType == MSG_TYPE_SUCCESS)
			$msgClass .= " msg_success";
		else if ($msgType == MSG_TYPE_ERROR)
			$msgClass .= " msg_error";
		html_op("<div class=\"".$msgClass."\">");
			html("<span>".$msgMessage."</span>");
		html_cl("</div>");

		$_SESSION["msg"] = MSG_NONE;
	}
?>