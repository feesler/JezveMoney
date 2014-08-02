<?php
	require_once("../setup.php");


	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");
?>
<!DOCTYPE html>
<html>
<head>
<title>Admin panel</title>
</head>
<body>
<b>Admin</b><br>
<a href="./currency.php">Currencies</a> <a href="./query.php">Queries</a> <a href="./log.php">Logs</a>
</body>
</html>
