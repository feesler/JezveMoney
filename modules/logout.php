<?php
	require_once("../setup.php");


	$u = new User();
	$u->logout();

	setLocation("../login.php");

?>