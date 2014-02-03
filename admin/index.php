<?php
	require_once("../setup.php");


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
	html("<a href=\"./currency.php\">Currencies</a> <a href=\"./query.php\">Queries</a>");
	html("</body>");
	html("</html>");
?>