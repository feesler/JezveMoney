<?php
	require_once("../setup.php");
	require_once("../class/user.php");
	require_once("../class/currency.php");
	require_once("../class/account.php");
	require_once("../class/person.php");
	require_once("../class/transaction.php");

	$user_id = User::check();
	if (!$user_id || $user_id != 1)
		setLocation("../login.php");

	html("<!DOCTYPE html>");
	html("<html>");
	html("<head>");
	html("<title>Admin panel</title>");
	html("</head>");
	html("<body>");
	html("<b>Admin</b><br>");
	html("<a href=\"./currency.php\">Currencies</a>");
	html("</body>");
	html("</html>");
?>