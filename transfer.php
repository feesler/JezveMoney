<?php
	require_once("./setup.php");

	session_start();

	$userid = checkUser("./login.php");
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>jezve Money - Transfer</title>
<?php
	getStyle($sitetheme);
?>
<script type="text/javascript" src="./js/common.js"></script>
<script type="text/javascript" src="./js/transaction.js"></script>
<script>
<?php
	echo(getAccountsArray($userid));

	$accCurr = getAccCurrInfo($userid);
	$src_id = (count($accCurr) > 0) ? $accCurr[0]["id"] : 0;
	$dest_id = (count($accCurr) > 1) ? $accCurr[1]["id"] : 0;
/*
	$resArr = $db->selectQ("a.id AS id, c.id AS curr_id, c.sign AS sign", "accounts AS a, currency AS c", "a.user_id=".$userid." AND c.id=a.curr_id");
	$accounts = count($resArr);

	$src_id = 0;
	$dest_id = 0;
	echo("var accounts = [");
	foreach($resArr as $i => $row)
	{
		echo("[".$row["id"].", ".$row["curr_id"].", ".json_encode($row["sign"]).", ".$row["balance"]."]".(($i < $accounts - 1) ? ", " : "];\r\n"));
		$accCurr[intval($row["id"])] = intval($row["curr_id"]);
		$accCurSign[intval($row["id"])] = $row["sign"];

		if ($i == 0)		// First account
			$src_id = intval($row["id"]);
		else if ($i == 1)	//Second account
			$dest_id = intval($row["id"]);
	}
*/

	echo(getCurrencyArray());
?>

</script>
</head>
<body>
<table class="maintable">
	<tr><td style="width: 500px;"><h1 class="maintitle">jezve Money</h1></td></tr>

<?php
	require_once("./templates/userblock.php");
	require_once("./templates/mainmenu.php");
?>

	<tr>
	<td class="submenu">
	<span><a href="./expense.php">Spend</a></span><span><a href="./income.php">Income</a></span><span><b>Transfer</b></span>
	</td>
	</tr>

<?php
	echo(getAccountsTable($userid, TRUE));

	$accounts = $db->countQ("accounts", "user_id=".$userid);
	if ($accounts > 0)
	{
?>

	<tr>
	<td>
	<form id="tranfrm" name="tranfrm" method="post" action="./modules/transfer.php" onsubmit="return onTransferSubmit(this);">
	<table>
		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Source account</span></td>
		<td>
			<select class="inp" id="srcid" name="srcid" onchange="onChangeSource();">
<?php
	echo(getAccountsList($userid, $src_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Destination account</span></td>
		<td>
			<select class="inp" id="destid" name="destid" onchange="onChangeDest();">
<?php
	echo(getAccountsList($userid, $dest_id));
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Transfer amount</span></td>
		<td><input class="inp" id="amount" name="amount" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"><span id="amountsign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $src_id)); /*echo($accCurSign[$src_id]);*/ ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"chargeoff\"");
/*
		if ($accCurr[$src_id] == $accCurr[$dest_id])
*/
		if (getCurrId($accCurr, $src_id) == getCurrId($accCurr, $dest_id))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo(getCurSign($accCurr, $dest_id)); /*echo($accCurSign[$dest_id]);*/ ?></span></td>
		</tr>

<?php
		echo("\t\t<tr id=\"exchange\"");
/*
		if ($accCurr[$src_id] == $accCurr[$dest_id])
*/
		if (getCurrId($accCurr, $src_id) == getCurrId($accCurr, $dest_id))
			echo(" style=\"display: none;\"");
		echo(">\r\n");
?>
		<td style="text-align: right;"><span style="margin-right: 5px;">Exchange rate</span></td>
		<td><input class="inp" id="exchrate" name="exchrate" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Date</span></td>
		<td><input class="inp" id="date" name="date" value="<?php echo(date("d.m.Y")); ?>"></td>
		</tr>

		<tr>
		<td align="right"><span style="margin-right: 5px;">Comment</span></td>
		<td><input class="inp" id="comm" name="comm"></td>
		</tr>

		<tr>
		<td colspan="2" style="text-align: center;"><input class="btn" type="submit" value="ok"></td>
		</tr>
	</table>
	</form>
	</td>
	</tr>

<?php
	}
?>
</table>
</body>
</html>
