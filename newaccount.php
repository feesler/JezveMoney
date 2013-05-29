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

	$titleString = "Jezve Money | New account";
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
<form method="post" action="./modules/createaccount.php" onsubmit="return onNewAccountSubmit(this);">
<div class="acc_content">
	<div class="profile_common">
		<h2>Create new account</h2>
		<div>
			<label for="accname">Account name</label>
			<div class="rdiv"><div><input id="accname" name="accname" type="text"></div></div>
			<label for="currency">Currency</label>
			<div class="rdiv">
				<div style="padding: 8px 70px 10px 5px;">
					<select id="currency" name="currency" onchange="onChangeAccountCurrency(this);">
<?php
	setTab(6);
	echo(Currency::getList());
	popTab();
?>
					</select>
				</div>
			</div>
			<label for="balance">Initial balance</label>
			<div>
				<div class="rtext"><span id="currsign" class="curr_sign">р.</span></div>
				<div class="rdiv">
					<div>
						<input class="summ_text" id="balance" name="balance" type="text" value="0">
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