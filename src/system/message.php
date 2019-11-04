<?php
	// Type of messages
	define("MSG_TYPE_NONE", 0);
	define("MSG_TYPE_SUCCESS", 1);
	define("MSG_TYPE_ERROR", 2);

	$msgArray = [];


	// Define new message constant
	function addMessage($constName, $msgType = MSG_TYPE_NONE, $message = NULL)
	{
		global $msgArray;

		$msgCounter = count($msgArray);
		define($constName, $msgCounter);

		if ($msgType != MSG_TYPE_NONE && !is_null($message))
			$msgArray[$msgCounter] = [$msgType, $message];
		else
			$msgArray[$msgCounter] = [MSG_TYPE_NONE];
	}


	addMessage("MSG_NONE");

	addMessage("MSG_REGISTER");
	addMessage("ERR_REGISTER_FAIL", MSG_TYPE_ERROR, "Fail to register.");
	addMessage("MSG_LOGIN");
	addMessage("ERR_LOGIN_FAIL", MSG_TYPE_ERROR, "Wrong login/password. Please check it and try to retype again.");
	addMessage("MSG_PROFILE_NAME", MSG_TYPE_SUCCESS, "User name successfully updated.");
	addMessage("ERR_PROFILE_NAME", MSG_TYPE_ERROR, "Fail to update user name.");
	addMessage("MSG_PROFILE_PASSWORD", MSG_TYPE_SUCCESS, "Password successfully updated.");
	addMessage("ERR_PROFILE_PASSWORD", MSG_TYPE_ERROR, "Fail to update password.");
	addMessage("MSG_PROFILE_RESETALL", MSG_TYPE_SUCCESS, "All data successfully reseted.");
	addMessage("ERR_PROFILE_RESETALL", MSG_TYPE_ERROR, "Fail to reset.");
	addMessage("MSG_PROFILE_DELETE", MSG_TYPE_SUCCESS, "Your profile is successfully deleted.");
	addMessage("ERR_PROFILE_DELETE", MSG_TYPE_ERROR, "Fail to delete profile.");

	addMessage("MSG_USER_CREATE", MSG_TYPE_SUCCESS, "User successfully created.");
	addMessage("ERR_USER_CREATE", MSG_TYPE_ERROR, "Fail to create user.");
	addMessage("MSG_USER_UPDATE", MSG_TYPE_SUCCESS, "User successfully updated.");
	addMessage("ERR_USER_UPDATE", MSG_TYPE_ERROR, "Fail to update user.");
	addMessage("MSG_USER_DELETE", MSG_TYPE_SUCCESS, "User successfully deleted.");
	addMessage("ERR_USER_DELETE", MSG_TYPE_ERROR, "Fail to delete user.");

	addMessage("MSG_ACCOUNT_CREATE");
	addMessage("ERR_ACCOUNT_CREATE", MSG_TYPE_ERROR, "Fail to create new account.");
	addMessage("MSG_ACCOUNT_UPDATE");
	addMessage("ERR_ACCOUNT_UPDATE", MSG_TYPE_ERROR, "Fail to update account.");
	addMessage("MSG_ACCOUNT_DELETE");
	addMessage("ERR_ACCOUNT_DELETE", MSG_TYPE_ERROR, "Fail to delete account.");
	addMessage("MSG_ACCOUNTS_RESET", MSG_TYPE_SUCCESS, "Accounts successfully reseted");
	addMessage("ERR_ACCOUNTS_RESET", MSG_TYPE_ERROR, "Fail to reset.");

	addMessage("MSG_CURRENCY_CREATE", MSG_TYPE_SUCCESS, "Currency successfully created.");
	addMessage("ERR_CURRENCY_CREATE", MSG_TYPE_ERROR, "Fail to create new currency.");
	addMessage("MSG_CURRENCY_UPDATE", MSG_TYPE_SUCCESS, "Currency successfully updated.");
	addMessage("ERR_CURRENCY_UPDATE", MSG_TYPE_ERROR, "Fail to update currency.");
	addMessage("MSG_CURRENCY_DELETE", MSG_TYPE_SUCCESS, "Currency successfully deleted.");
	addMessage("ERR_CURRENCY_DELETE", MSG_TYPE_ERROR, "Fail to delete currency.");

	addMessage("MSG_PERSON_CREATE");
	addMessage("ERR_PERSON_CREATE", MSG_TYPE_ERROR, "Fail to create new person.");
	addMessage("ERR_PERSON_CREATE_EXIST", MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist.");
	addMessage("MSG_PERSON_UPDATE");
	addMessage("ERR_PERSON_UPDATE", MSG_TYPE_ERROR, "Fail to update person.");
	addMessage("ERR_PERSON_UPDATE_EXIST", MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist.");
	addMessage("MSG_PERSON_DELETE");
	addMessage("ERR_PERSON_DELETE", MSG_TYPE_ERROR, "Fail to delete person.");

	addMessage("MSG_TRANS_CREATE");
	addMessage("ERR_TRANS_CREATE", MSG_TYPE_ERROR, "Fail to create new transaction.");
	addMessage("MSG_TRANS_UPDATE");
	addMessage("ERR_TRANS_UPDATE", MSG_TYPE_ERROR, "Fail to update transaction.");
	addMessage("MSG_TRANS_DELETE");
	addMessage("ERR_TRANS_DELETE", MSG_TYPE_ERROR, "Fail to delete transaction.");

	addMessage("MSG_DEBT_CREATE");
	addMessage("ERR_DEBT_CREATE", MSG_TYPE_ERROR, "Fail to create new debt.");
	addMessage("MSG_DEBT_UPDATE");
	addMessage("ERR_DEBT_UPDATE", MSG_TYPE_ERROR, "Fail to update debt.");


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


	// Return message string by id
	function getMessage($msg_id)
	{
		global $msgArray;

		if (!isset($msgArray[$msg_id]))
			return NULL;

		$msgParam = $msgArray[$msg_id];
		$msgMessage = $msgParam[1];

		return $msgMessage;
	}


	// Check message is set
	function isMessageSet()
	{
		global $msgArray;

		sessionStart();

		if (!isset($_SESSION["msg"]))
			return FALSE;

		$msg_id = intval($_SESSION["msg"]);
		if ($msg_id == MSG_NONE || !isset($msgArray[$msg_id]))
			return FALSE;

		$msgParam = $msgArray[$msg_id];
		$msgType = $msgParam[0];
		if ($msgType == MSG_TYPE_NONE)
			return FALSE;

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

		include(APPROOT."view/templates/message.tpl");

		$_SESSION["msg"] = MSG_NONE;
	}