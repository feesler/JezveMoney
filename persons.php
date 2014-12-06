<?php
	require_once("./system/setup.php");

	checkUser();

	$pers = new Person($user_id);

	$persArr = $pers->getArray();

	$titleString = "Jezve Money | Persons";

	$cssArr = array("common.css", "tiles.css", "popup.css", "iconlink.css", "toolbar.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "popup.js", "toolbar.js", "persons.js");

	include("./view/templates/persons.tpl");
?>