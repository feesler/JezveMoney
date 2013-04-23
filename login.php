<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$user_id = User::check();
	if ($user_id != 0)
		setLocation("./index.php");

	$titleString = "Jezve Money | Log in";
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0" />
<?php
	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));
?>
</head>
<body>
<?php
	require_once("./templates/header.php");
?>
<form action="./modules/login.php" method="post" onsubmit="return onLoginSubmit(this);">
<div class="cont login_cont">
	<div class="box">
		<h1>Log in</h1>
		<label for="login">Username</label>
		<div class="rdiv"><div><input id="login" name="login" type="text"></div></div>
		<label for="password">Password</label>
		<div class="rdiv"><div><input id="password" name="password" type="password"></div></div>
		<div><input class="ok_btn" type="submit" value="Log in"><span class="alter_link"><a href="./register.php">Register</a></span></div>
	</div>
</div>
</form>
</body>
</html>