<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$user_id = User::check();
	if ($user_id != 0)
		setLocation("./index.php");

	$titleString = "Jezve Money | Registration";
?>
<!DOCTYPE html>
<html>
<head>
<?php
	html(getCommonHeaders());

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
<form action="./modules/register.php" method="post" onsubmit="return onLoginSubmit(this);">
<div class="page register_page">
	<div class="cont">
		<div class="box">
			<h1>Registration</h1>
			<label for="login">Account name</label>
			<div class="stretch_input profile_input"><div><input id="login" name="login" type="text"></div></div>
			<label for="login">Name</label>
			<div class="stretch_input profile_input"><div><input id="name" name="name" type="text"></div></div>
			<label for="password">Password</label>
			<div class="stretch_input profile_input"><div><input id="password" name="password" type="password"></div></div>
			<div class="login_controls"><input class="btn ok_btn" type="submit" value="ok"><span class="alter_link"><a href="./login.php">Log in</a></span></div>
		</div>
	</div>
</div>
</form>
</body>
</html>