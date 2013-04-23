<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$titleString = "Jezve Money | Profile";
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
<div class="content">
	<div>
		<form method="post" action="./modules/changepassword.php" onsubmit="return onChangePassSubmit(this);">
		<span class="widget_title">Change password</span>
		<div class="profile_common">
			<label for="oldpwd">Current password</label>
			<div class="rdiv"><div><input id="oldpwd" name="oldpwd" type="password"></div></div>
			<label for="newpwd">New password</label>
			<div class="rdiv"><div><input id="newpwd" name="newpwd" type="password"></div></div>
			<div><input class="ok_btn" type="submit" value="ok"></div>
		</div>
		</form>
	</div>
</div>
</body>
</html>