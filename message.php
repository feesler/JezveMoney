<?php

	// Type of messages
	define("MSG_TYPE_NONE", 0, TRUE);
	define("MSG_TYPE_SUCCESS", 1, TRUE);
	define("MSG_TYPE_ERROR", 2, TRUE);

	define("MSG_NONE", 0, TRUE);

	define("MSG_REGISTER", 1, TRUE);
	define("ERR_REGISTER_FAIL", 2, TRUE);
	define("MSG_LOGIN", 3, TRUE);
	define("ERR_LOGIN_FAIL", 4, TRUE);
	define("MSG_PROFILE_NAME", 5, TRUE);
	define("ERR_PROFILE_NAME", 6, TRUE);
	define("MSG_PROFILE_PASSWORD", 7, TRUE);
	define("ERR_PROFILE_PASSWORD", 8, TRUE);
	define("MSG_PROFILE_RESETALL", 9, TRUE);
	define("ERR_PROFILE_RESETALL", 10, TRUE);

	define("MSG_ACCOUNT_CREATE", 11, TRUE);
	define("ERR_ACCOUNT_CREATE", 12, TRUE);
	define("MSG_ACCOUNT_UPDATE", 13, TRUE);
	define("ERR_ACCOUNT_UPDATE", 14, TRUE);
	define("MSG_ACCOUNT_DELETE", 15, TRUE);
	define("ERR_ACCOUNT_DELETE", 16, TRUE);
	define("MSG_ACCOUNTS_RESET", 17, TRUE);
	define("ERR_ACCOUNTS_RESET", 18, TRUE);

	define("MSG_CURRENCY_CREATE", 19, TRUE);
	define("ERR_CURRENCY_CREATE", 20, TRUE);
	define("MSG_CURRENCY_DELETE", 21, TRUE);
	define("ERR_CURRENCY_DELETE", 22, TRUE);

	define("MSG_PERSON_CREATE", 23, TRUE);
	define("ERR_PERSON_CREATE", 24, TRUE);
	define("MSG_PERSON_UPDATE", 25, TRUE);
	define("ERR_PERSON_UPDATE", 26, TRUE);
	define("MSG_PERSON_DELETE", 27, TRUE);
	define("ERR_PERSON_DELETE", 28, TRUE);

	define("MSG_TRANS_CREATE", 29, TRUE);
	define("ERR_TRANS_CREATE", 30, TRUE);
	define("MSG_TRANS_UPDATE", 31, TRUE);
	define("ERR_TRANS_UPDATE", 32, TRUE);
	define("MSG_TRANS_DELETE", 33, TRUE);
	define("ERR_TRANS_DELETE", 34, TRUE);

	define("MSG_DEBT_CREATE", 35, TRUE);
	define("ERR_DEBT_CREATE", 36, TRUE);
	define("MSG_DEBT_UPDATE", 37, TRUE);
	define("ERR_DEBT_UPDATE", 38, TRUE);


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