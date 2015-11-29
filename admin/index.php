<?php
	require_once("../system/setup.php");

	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");

	$menuItems = array("curr" => array("title" => "Currencies", "link" => "./currency.php"),
					"query" => array("title" => "Queries", "link" => "./query.php"),
					"log" => array("title" => "Logs", "link" => "./log.php"),
					"apitest" => array("title" => "API test", "link" => "./apitest.php"));

	$titleString = "Admin panel";

	$cssMainArr = array("common.css");
	$cssLocalArr = array("admin.css");
	$jsMainArr = array();
	$jsLocalArr = array();

	include("./view/templates/index.tpl");
