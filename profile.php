<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$action = "";
	if (isset($_GET["act"]))
	{
		if ($_GET["act"] == "changepassword" || $_GET["act"] == "changename")
			$action = $_GET["act"];
		else
			setLocation("./profile.php");
	}

	$user_login = $u->getLogin($user_id);

	$person_name = "";
	$owner_id = $u->getOwner($user_id);

	$person = new Person($user_id);

	$person_name = $person->getName($owner_id);

	$titleString = "Jezve Money | Profile";
	if ($action == "changename")
		$titleString .= " | Change name";
	else if ($action == "changepassword")
		$titleString .= " | Change password";

	$cssArr = array("common.css", "popup.css", "user.css", "iconlink.css");
	$jsArr = array("common.js", "ready.js", "popup.js", "main.js");

	include("./templates/profile.tpl");
?>