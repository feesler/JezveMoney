<?php
	require_once("./system/setup.php");

	checkUser();

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$tilesArr = $acc->getTilesArray();

	$titleString = "Jezve Money | Accounts";

	$cssArr = array("common.css", "tiles.css", "popup.css", "iconlink.css", "toolbar.css");
	$jsArr = array("es5-shim.min.js", "common.js", "app.js", "popup.js", "currency.js", "toolbar.js", "main.js");

	include("./view/templates/accounts.tpl");
?>