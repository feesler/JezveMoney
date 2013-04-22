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
	margin-top: 55px;
	border: 1px solid #00FFFF;
/*	background-color: #00FFFF; */
}


.box
{
	max-width: 600px;
	min-width: 130px;
	margin: 0 auto;
/*	background-color: #FFB0FF; */
}


.ldiv
{
	width: 150px;
	height: 20px;
	line-height: 20px;
/*	background-color: #80FF80; */
}


.ldiv > span
{
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

/*	background-color: #FFFFB0; */
}


.rdiv > div > .rinp
{
	width: 100%;
	height: 26px;
	margin: 0;
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
		<div class="ldiv"><span>Username</span></div>
		<div class="rdiv"><div><input class="rinp" type="text"></div></div>
		<div class="ldiv"><span>Password</span></div>
		<div class="rdiv"><div><input class="rinp" type="text"></div></div>
	</div>
</div>
</form>
</body>
</html>