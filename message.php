<?php

	// Type of messages
	define("MSG_TYPE_NONE", 0, TRUE);
	define("MSG_TYPE_SUCCESS", 1, TRUE);
	define("MSG_TYPE_ERROR", 2, TRUE);

	define("MSG_NONE", 0, TRUE);
	define("ERR_LOGIN_FAIL", 1, TRUE);

	$msgArray = array(
		1 => array(MSG_TYPE_ERROR, "Wrong login/password. Please check it and try to retype again.")
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