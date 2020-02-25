<?php
	// Type of messages
	define("MSG_TYPE_NONE", 0);
	define("MSG_TYPE_SUCCESS", 1);
	define("MSG_TYPE_ERROR", 2);


class Message
{
	private static $msgArray = [];


	// Define new message constant
	public static function add($constName, $msgType = MSG_TYPE_NONE, $message = NULL)
	{
		$msgCounter = count(self::$msgArray);
		define($constName, $msgCounter);

		if ($msgType != MSG_TYPE_NONE && !is_null($message))
			self::$msgArray[$msgCounter] = [$msgType, $message];
		else
			self::$msgArray[$msgCounter] = [MSG_TYPE_NONE];
	}


	// Try to set message
	public static function set($msg_id)
	{
		sessionStart();

		if (!isset(self::$msgArray[$msg_id]))
			return FALSE;

		$_SESSION["msg"] = $msg_id;

		return TRUE;
	}


	// Return message string by id
	public static function get($msg_id)
	{
		if (!isset(self::$msgArray[$msg_id]))
			return NULL;

		$msgParam = self::$msgArray[$msg_id];
		$msgMessage = $msgParam[1];

		return $msgMessage;
	}


	// Check message is set
	public static function isSet()
	{
		sessionStart();

		if (!isset($_SESSION["msg"]))
			return FALSE;

		$msg_id = intval($_SESSION["msg"]);
		if ($msg_id == MSG_NONE || !isset(self::$msgArray[$msg_id]))
			return FALSE;

		$msgParam = self::$msgArray[$msg_id];
		$msgType = $msgParam[0];
		if ($msgType == MSG_TYPE_NONE)
			return FALSE;

		return TRUE;
	}


	// Check message and show it if available
	public static function check()
	{
		sessionStart();

		if (!isset($_SESSION["msg"]))
			return;

		$msg_id = intval($_SESSION["msg"]);
		if ($msg_id == MSG_NONE || !isset(self::$msgArray[$msg_id]))
			return;

		$msgParam = self::$msgArray[$msg_id];
		$msgType = $msgParam[0];
		if ($msgType == MSG_TYPE_NONE)
		{
			$_SESSION["msg"] = MSG_NONE;
			return;
		}

		$msgMessage = $msgParam[1];

		$msgClass = "";
		if ($msgType == MSG_TYPE_SUCCESS)
			$msgClass = "msg_success";
		else if ($msgType == MSG_TYPE_ERROR)
			$msgClass = "msg_error";

		include(TPL_PATH."message.tpl");

		$_SESSION["msg"] = MSG_NONE;
	}
}


Message::add("MSG_NONE");

Message::add("MSG_REGISTER", MSG_TYPE_SUCCESS, "You successfully registered.");
Message::add("ERR_REGISTER_FAIL", MSG_TYPE_ERROR, "Fail to register.");
Message::add("MSG_LOGIN");
Message::add("ERR_LOGIN_FAIL", MSG_TYPE_ERROR, "Wrong login/password. Please check it and try to retype again.");
Message::add("MSG_PROFILE_NAME", MSG_TYPE_SUCCESS, "User name successfully updated.");
Message::add("ERR_PROFILE_NAME", MSG_TYPE_ERROR, "Fail to update user name.");
Message::add("MSG_PROFILE_PASSWORD", MSG_TYPE_SUCCESS, "Password successfully updated.");
Message::add("ERR_PROFILE_PASSWORD", MSG_TYPE_ERROR, "Fail to update password.");
Message::add("MSG_PROFILE_RESETALL", MSG_TYPE_SUCCESS, "All data successfully reseted.");
Message::add("ERR_PROFILE_RESETALL", MSG_TYPE_ERROR, "Fail to reset.");
Message::add("MSG_PROFILE_DELETE", MSG_TYPE_SUCCESS, "Your profile is successfully deleted.");
Message::add("ERR_PROFILE_DELETE", MSG_TYPE_ERROR, "Fail to delete profile.");

Message::add("MSG_USER_CREATE", MSG_TYPE_SUCCESS, "User successfully created.");
Message::add("ERR_USER_CREATE", MSG_TYPE_ERROR, "Fail to create user.");
Message::add("MSG_USER_UPDATE", MSG_TYPE_SUCCESS, "User successfully updated.");
Message::add("ERR_USER_UPDATE", MSG_TYPE_ERROR, "Fail to update user.");
Message::add("MSG_USER_DELETE", MSG_TYPE_SUCCESS, "User successfully deleted.");
Message::add("ERR_USER_DELETE", MSG_TYPE_ERROR, "Fail to delete user.");

Message::add("MSG_ACCOUNT_CREATE");
Message::add("ERR_ACCOUNT_CREATE", MSG_TYPE_ERROR, "Fail to create new account.");
Message::add("MSG_ACCOUNT_UPDATE");
Message::add("ERR_ACCOUNT_UPDATE", MSG_TYPE_ERROR, "Fail to update account.");
Message::add("MSG_ACCOUNT_DELETE");
Message::add("ERR_ACCOUNT_DELETE", MSG_TYPE_ERROR, "Fail to delete account.");
Message::add("MSG_ACCOUNTS_RESET", MSG_TYPE_SUCCESS, "Accounts successfully reseted");
Message::add("ERR_ACCOUNTS_RESET", MSG_TYPE_ERROR, "Fail to reset.");

Message::add("MSG_CURRENCY_CREATE", MSG_TYPE_SUCCESS, "Currency successfully created.");
Message::add("ERR_CURRENCY_CREATE", MSG_TYPE_ERROR, "Fail to create new currency.");
Message::add("MSG_CURRENCY_UPDATE", MSG_TYPE_SUCCESS, "Currency successfully updated.");
Message::add("ERR_CURRENCY_UPDATE", MSG_TYPE_ERROR, "Fail to update currency.");
Message::add("MSG_CURRENCY_DELETE", MSG_TYPE_SUCCESS, "Currency successfully deleted.");
Message::add("ERR_CURRENCY_DELETE", MSG_TYPE_ERROR, "Fail to delete currency.");

Message::add("MSG_PERSON_CREATE");
Message::add("ERR_PERSON_CREATE", MSG_TYPE_ERROR, "Fail to create new person.");
Message::add("ERR_PERSON_CREATE_EXIST", MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist.");
Message::add("MSG_PERSON_UPDATE");
Message::add("ERR_PERSON_UPDATE", MSG_TYPE_ERROR, "Fail to update person.");
Message::add("ERR_PERSON_UPDATE_EXIST", MSG_TYPE_ERROR, "Fail to update person. Person with same name already exist.");
Message::add("MSG_PERSON_DELETE");
Message::add("ERR_PERSON_DELETE", MSG_TYPE_ERROR, "Fail to delete person.");

Message::add("MSG_TRANS_CREATE");
Message::add("ERR_TRANS_CREATE", MSG_TYPE_ERROR, "Fail to create new transaction.");
Message::add("MSG_TRANS_UPDATE");
Message::add("ERR_TRANS_UPDATE", MSG_TYPE_ERROR, "Fail to update transaction.");
Message::add("MSG_TRANS_DELETE");
Message::add("ERR_TRANS_DELETE", MSG_TYPE_ERROR, "Fail to delete transaction.");

Message::add("MSG_DEBT_CREATE");
Message::add("ERR_DEBT_CREATE", MSG_TYPE_ERROR, "Fail to create new debt.");
Message::add("MSG_DEBT_UPDATE");
Message::add("ERR_DEBT_UPDATE", MSG_TYPE_ERROR, "Fail to update debt.");
