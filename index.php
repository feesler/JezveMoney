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

	$titleString = "Jezve Money | Design template";
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
</head>
<body>
<div class="header">
	<div class="logo"><a href="./index.php"><span>Jezve Money</span></a></div>
	<div class="userblock">
		<button onclick="onUserClick()"><span><?php echo(User::getName($user_id)); ?></span></button>
		<div id="menupopup" class="usermenu" style="display: none;">
			<ul>
				<li><a href="#">profile</a></li>
				<li><a href="#">logout</a></li>
			</ul>
		</div>
	</div>
</div>
<div class="content">
	<div>
		<span class="widget_title">Accounts &gt;</span>
		<div class="tiles"><?php echo($acc->getTiles()); ?></div>
	</div>

	<div>
		<span class="widget_title">Total &gt;</span>
		<div>
<?php
	echo($acc->getTotals());
?>
		</div>
	</div>

	<div>
		<span class="widget_title">Latest &gt;</span>
		<div>
<?php
	echo($trans->getLatest(5));
?>
		</div>
	</div>

	<div><div></div></div>
</div>
</body>
</html>