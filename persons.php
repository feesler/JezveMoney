<?php
	require_once("./setup.php");

	checkUser();

	$pers = new Person($user_id);

	$persArr = $pers->getArray();

	$titleString = "Jezve Money | Persons";

	$cssArr = array("common.css", "tiles.css", "popup.css", "iconlink.css", "toolbar.css");
	$jsArr = array("common.js", "ready.js", "popup.js", "toolbar.js", "persons.js");

	include("./templates/persons.tpl");
?>