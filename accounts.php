<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/person.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$user_id = User::check();
	if (!$user_id)
		setLocation("./login.php");

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	$titleString = "Jezve Money | Accounts";
?>
<!DOCTYPE html>
<html>
<head>
<?php
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("tiles.css"));
	html(getCSS("iconlink.css"));
	html(getCSS("popup.css"));
	html(getJS("common.js"));
	html(getJS("popup.js"));
	html(getJS("main.js"));
?>
</head>
<body>
<?php
	require_once("./templates/header.php");
?>
<div class="content">
	<div>
		<div class="heading">
			<h1>Accounts</h1>
			<div id="add_btn" class="iconlink"><a href="./newaccount.php"><div class="add"></div><span>New</span></a></div>
		</div>
		<div class="tiles"><?php echo($acc->getTiles(TRUE)); ?></div>
		<div class="control_icons">
			<div id="edit_btn" class="iconlink" style="display: none;"><a href="#"><div class="edit"></div><span>Edit</span></a></div>
			<div id="del_btn" class="iconlink" style="display: none;"><button onclick="showDeletePopup();"><div class="del"></div><span>Delete</span></button></div>
		</div>
	</div>
</div>
</body>
</html>