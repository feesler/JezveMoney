<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");

	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	$user_name = User::getName($user_id);

	$person_name = "";
	$owner_id = User::getOwner($user_id);

	$person = new Person($user_id);

	$person_name = $person->getName($owner_id);

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

	html("<script>");
	html("var p_name = ".json_encode($person_name).";");
	html("</script>");
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

	<div>
		<form method="post" action="./modules/changename.php" onsubmit="return onChangeNameSubmit(this);">
		<span class="widget_title">Change name</span>
		<div class="profile_common">
			<label for="newpwd">New name</label>
			<div class="rdiv"><div><input id="newname" name="newname" type="text"></div></div>
			<div><input class="ok_btn" type="submit" value="ok"></div>
		</div>
		</form>
	</div>
</div>
</body>
</html>