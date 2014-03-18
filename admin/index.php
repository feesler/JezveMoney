<?php
	require_once("../setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
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