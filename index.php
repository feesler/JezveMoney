<?php
	require_once("./setup.php");
	require_once("./class/user.php");
	require_once("./class/currency.php");
	require_once("./class/account.php");
	require_once("./class/transaction.php");

	$userid = User::check();
	if (!$userid)
		setLocation("./login.php");

	$acc = new Account($userid);
	$trans = new Transaction($userid);

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
		<button onclick="onUserClick()"><span>username</span></button>
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
		<span class="widget_title">Latest &gt;</span>
		<div>
<?php
	echo($trans->getLatest(5));
?>
<!--
			<table class="tbl">
				<tr>
					<td class="latest">
						<span class="latest_acc_name">Visa Electron</span>
						<span class="latest_sum">+ 3 480,00 р.</span>
						<span class="latest_date">12.04.2013</span>
						<span class="latest_comm">Salary</span>
					</td>
				</tr>

				<tr class="even_row">
					<td class="latest">
						<span class="latest_acc_name">На руках</span>
						<span class="latest_sum">- 116,00 р.</span>
						<span class="latest_date">11.04.2013</span>
						<span class="latest_comm">Сигареты</span>
					</td>
				</tr>

				<tr>
					<td class="latest">
						<span class="latest_acc_name">На руках</span>
						<span class="latest_sum">- 30,00 р.</span>
						<span class="latest_date">11.04.2013</span>
						<span class="latest_comm">Ватрушка</span>
					</td>
				</tr>

				<tr class="even_row">
					<td class="latest">
						<span class="latest_acc_name">Visa Electron</span>
						<span class="latest_sum">- 520,00 р.</span>
						<span class="latest_date">10.04.2013</span>
						<span class="latest_comm">Starbucks</span>
					</td>
				</tr>

				<tr>
					<td class="latest">
						<span class="latest_acc_name">Visa Electron → На руках</span>
						<span class="latest_sum">500,00 р.</span>
						<span class="latest_date">09.04.2013</span>
					</td>
				</tr>
			</table>
-->
		</div>
	</div>

	<div>
		<span class="widget_title">Total &gt;</span>
		<div>
			<table class="tbl">
				<tr>
					<td class="latest">
						<span class="latest_acc_name">RUR</span>
						<span class="latest_sum">20 826,27 р.</span>
					</td>
				</tr>

				<tr class="even_row">
					<td class="latest">
						<span class="latest_acc_name">EUR</span>
						<span class="latest_sum">€ 0,00</span>
					</td>
				</tr>

				<tr>
					<td class="latest">
						<span class="latest_acc_name">USD</span>
						<span class="latest_sum">$ 5,60</span>
					</td>
				</tr>

				<tr class="even_row">
					<td class="latest">
						<span class="latest_acc_name">PLN</span>
						<span class="latest_sum">11,30 zł</span>
					</td>
				</tr>
			</table>
		</div>
	</div>

	<div><div></div></div>
</div>
</body>
</html>