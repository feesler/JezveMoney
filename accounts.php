﻿<?php
	require_once("./setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$tilesArr = $acc->getTilesArray();

	$titleString = "Jezve Money | Accounts";

	$cssArr = array("common.css", "tiles.css", "popup.css", "iconlink.css", "toolbar.css");
	$jsArr = array("common.js", "ready.js", "popup.js", "currency.js", "toolbar.js", "main.js");

	include("./templates/accounts.tpl");
?>