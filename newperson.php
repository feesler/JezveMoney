<?php
	require_once("./setup.php");

	checkUser();

	$person = new Person($user_id);

	$titleString = "Jezve Money | New person";

	$cssArr = array("common.css", "iconlink.css", "tiles.css");
	$jsArr = array("common.js", "ready.js", "persons.js");

	include("./templates/newperson.tpl");
?>