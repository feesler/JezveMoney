<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

/*
	$user_id = User::check();
	if ($user_id != 0)
		setLocation("./index.php");
*/

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
	html(getCSS("tiles.css"));
	html(getCSS("table.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));
?>
<style>
/* layered layout */
.cont
{
	margin-top: 50px;
}


.box
{
	max-width: 600px;
	min-width: 130px;
	margin: 0 auto;
}


.box > label
{
	width: 150px;
	height: 20px;
	line-height: 20px;
	padding: 0px 5px;
}


.rdiv
{
	width: 100%;
	min-width: 240px;
	height: 50px;
}


.rdiv > div
{
	height: 32px;
	padding: 8px 19px 10px 5px;
}


.rdiv > div > input
{
	width: 100%;
	height: 26px;
	margin: 0;
}


.box > div > .ok_btn
{
	font-family: "Segoe UI", "Lucida Sans Unicode", "Geneva", "Helvetica Neue", "Arial", "Nimbus Sans L", sans-serif;
	margin: 29px 0px 8px 5px;
	padding: 4px 22px;
	border: 0 none;
	background-color: #4040FF;
	color: #FFFFFF;
}
</style>
</head>
<body>
<?php
	require_once("./templates/header.php");
?>
<form action="./modules/login.php" method="post">
<div class="cont">
	<div class="box">
		<label for="login">Username</label>
		<div class="rdiv"><div><input id="login" type="text"></div></div>
		<label for="password">Password</label>
		<div class="rdiv"><div><input id="password" type="text"></div></div>
		<div><input class="ok_btn" type="submit" value="Log in"></div>
	</div>
</div>
</form>
</body>
</html>