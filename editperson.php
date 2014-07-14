<?php
	require_once("./setup.php");

	function fail()
	{
		setMessage(ERR_PERSON_UPDATE);
		setLocation("./persons.php");
	}


	checkUser();

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$p_id = intval($_GET["id"]);

	$person = new Person($user_id);
	if (!$person->is_exist($p_id))
		fail();

	$pName = $person->getName($p_id);

	$titleString = "Jezve Money | Edit person";

	$cssArr = array("common.css", "iconlink.css", "tiles.css", "popup.css");
	$jsArr = array("common.js", "ready.js", "popup.js", "persons.js");

	include("./templates/editperson.tpl");
?>