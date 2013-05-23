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

	$titleString = "Jezve Money";
?>
<!DOCTYPE html>
<html>
<head>
<?php
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("tiles.css"));
	html(getCSS("table.css"));
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
		<div class="widget_title"><a href="./accounts.php">Accounts &gt;</a></div>
		<div class="tiles"><?php echo($acc->getTiles()); ?></div>
	</div>

	<div>
		<div class="widget_title">Total &gt;</div>
		<div>
<?php
	echo($acc->getTotals());
?>
		</div>
	</div>

	<div>
		<div class="widget_title">Latest &gt;</div>
		<div>
<?php
	echo($trans->getLatest(5));
?>
		</div>
	</div>
</div>
</body>
</html>