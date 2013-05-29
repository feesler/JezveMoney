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

	if (!isset($_GET["id"]) || !is_numeric($_GET["id"]))
		fail();

	$acc_id = intval($_GET["id"]);

	$acc = new Account($user_id);
	$trans = new Transaction($user_id);

	if (!$acc->is_exist($acc_id))
		fail();


	$acc_name = $acc->getName($acc_id);
	$acc_curr = $acc->getCurrency($acc_id);
	$acc_bal = $acc->getInitBalance($acc_id);

	$curr_sign = Currency::getSign($acc_curr);

	$titleString = "Jezve Money | Edit account";
?>
<!DOCTYPE html>
<html>
<head>
<?php
	html(getCommonHeaders());

	html("<title>".$titleString."</title>");
	html(getCSS("common.css"));
	html(getCSS("login.css"));
	html(getCSS("tiles.css"));
	html(getJS("common.js"));
	html(getJS("main.js"));
	html("<script>");
	echo(Currency::getArray());
	html("</script>");
?>
</head>
<body>
<?php
	require_once("./templates/header.php");
?>
<form method="post" action="./modules/editaccount.php" onsubmit="return onNewAccountSubmit(this);">
<input id="accid" name="accid" type="hidden" value="<?php echo($acc_id); ?>">
<div class="acc_content">
	<div class="profile_common">
		<h2>Edit account</h2>
		<div>
			<label for="accname">Account name</label>
			<div class="rdiv"><div><input id="accname" name="accname" type="text" value="<?php echo($acc_name); ?>"></div></div>
			<label for="currency">Currency</label>
			<div class="rdiv">
				<div>
					<select id="currency" name="currency" onchange="onChangeAccountCurrency(this);">
<?php
	setTab(6);
	echo(Currency::getList($acc_curr));
	popTab();
?>
					</select>
				</div>
			</div>
			<label for="balance">Initial balance</label>
			<div>
				<div class="rtext"><span id="currsign" class="curr_sign"><?php echo($curr_sign); ?></span></div>
				<div class="rdiv">
					<div>
						<input class="summ_text" id="balance" name="balance" type="text" value="<?php echo($acc_bal); ?>">
					</div>
				</div>
			</div>
			<div><input class="ok_btn" type="submit" value="ok"><a class="cancel_btn" href="./accounts.php">cancel</a></div>
		</div>
	</div>
</div>
</form>
</body>
</html>