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
.cont
{
	margin-top: 55px;
	border: 1px solid cyan;
}


.box
{
	max-width: 400px;
	min-width: 240px;
	border: 1px solid magenta;
	margin: 0 auto 0 auto;
}


.box > table
{
	width: 100%;
	border-collapse: collapse;
}


.lcell
{
	border: 1px solid lightgreen;
	text-align: right;
}


.rcell
{
	border: 1px solid magenta;
	text-align: left;
	width: 100%;
	padding: 2px 5px;
}

.rcell > div
{
	margin: 10px;
}


.rcinp
{
	width: 100%;
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
		<table>
			<tr>
				<td class="lcell"><label for="login">Username</label></td>
				<td class="rcell"><div><input class="rcinp" id="login" name="login" type="text"></div></td>
			</tr>
			<tr>
				<td class="lcell"><label for="pass">Password</label></td>
				<td class="rcell"><div><input class="rcinp" id="pass" name="pass" type="text"></div></td>
			</tr>
		</table>
	</div>
</div>
</form>
</body>
</html>