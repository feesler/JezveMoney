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
<?php
	html(getCommonHeaders());

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
<div class="profile_content">
	<div class="profile_summary">
		<h1>User profile</h1>
		<div>
			<h2>Account name</h2>
			<span><?php echo($user_name); ?></span>
		</div>

		<div>
			<h2>User name</h2>
			<span><?php echo($user_name); ?></span>
			<div><a href="./profile.php?act=changename">Change</a></div>
		</div>

		<div>
			<h2>Security</h2>
			<div><a href="./profile.php?act=changepassword">Change password</a></div>
		</div>
	</div>

		<form method="post" action="./modules/changepassword.php" onsubmit="return onChangePassSubmit(this);">
		<div class="profile_common">
		<h2>Change password</h2>
		<div>
			<label for="oldpwd">Current password</label>
			<div class="rdiv"><div><input id="oldpwd" name="oldpwd" type="password"></div></div>
			<label for="newpwd">New password</label>
			<div class="rdiv"><div><input id="newpwd" name="newpwd" type="password"></div></div>
			<div><input class="ok_btn" type="submit" value="ok"></div>
		</div>
	</div>
	</form>

		<form method="post" action="./modules/changename.php" onsubmit="return onChangeNameSubmit(this);">
		<div class="profile_common">
		<h2>Change name</h2>
		<div>
			<label for="newpwd">New name</label>
			<div class="rdiv"><div><input id="newname" name="newname" type="text"></div></div>
			<div><input class="ok_btn" type="submit" value="ok"></div>
		</div>
	</div>
	</form>
</div>
</body>
</html>