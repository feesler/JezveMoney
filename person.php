<?php
	require_once("./setup.php");

	function fail($msg = NULL)
	{
		if (!is_null($msg))
			setMessage($msg);
		setLocation("./persons.php");
	}

	checkUser();

	$person = new Person($user_id);

	if (isset($_GET["act"]))
		$action = $_GET["act"];
	else
		$action = "new";
	if ($action != "new" && $action != "edit")
		fail();

	if ($action == "edit")
	{
		if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
			fail(ERR_PERSON_UPDATE);

		$p_id = intval($_GET["id"]);
		if (!$person->is_exist($p_id))
			fail(ERR_PERSON_UPDATE);

		$pName = $person->getName($p_id);
	}
	
	$titleString = "Jezve Money | ";
	$titleString .= ($action == "new") ? "New person" : "Edit person";

	$cssArr = array("common.css", "iconlink.css", "tiles.css");
	$jsArr = array("common.js", "ready.js", "persons.js");
	if ($action == "edit")
	{
		$cssArr[] = "popup.css";
		$jsArr[] = "popup.js";
	}

	if ($action == "new")
		include("./templates/newperson.tpl");
	else if ($action == "edit")
		include("./templates/editperson.tpl");
?>