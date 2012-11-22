<?php
	require_once("./setup.php");

	session_start();

	$userid = checkUser('./login.php');
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
	$resArr = $db->selectQ("c.id AS curr_id, c.sign AS sign", "accounts AS a, currency AS c", "a.user_id='".$userid."' AND c.id=a.curr_id");
	$accounts = count($resArr);
	echo("var accounts = ".$accounts.";\r\nvar acccur = [");
	foreach($resArr as $i => $row)
	{
		echo("[".$row['curr_id'].", '".$row['sign']."']".(($i < $accounts - 1) ? ", " : "];\r\n"));
		$cursign[$i] = $row['sign'];
	}
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
	getAccountsTable($userid, TRUE);
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
	$resArr = $db->selectQ("*", "accounts", "user_id=".$userid);
	foreach($resArr as $i => $row)
	{
		echo("\t\t\t\t<option value=\"".$row['id']."\"".(($i == 0) ? " selected" : "").">".$row['name']."</option>\r\n");
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Destination account</span></td>
		<td>
			<select class="inp" id="destid" name="destid" onchange="onChangeDest();">
<?php
	$resArr = $db->selectQ("*", "accounts", "user_id=".$userid);
	foreach($resArr as $i => $row)
	{
		echo("\t\t\t\t<option value=\"".$row['id']."\"".(($i == 1) ? " selected" : "").">".$row['name']."</option>\r\n");
	}
?>
			</select>
		</td>
		</tr>

		<tr>
		<td style="text-align: right;"><span style="margin-right: 5px;">Transfer amount</span></td>
		<td><input class="inp" id="amount" name="amount" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"><span id="amountsign" style="margin-left: 5px;"><?php echo($cursign[0]); ?></span></td>
		</tr>

		<tr id="chargeoff" style="display: none;">
		<td style="text-align: right;"><span style="margin-right: 5px;">Charge off</span></td>
		<td><input class="inp" id="charge" name="charge" oninput="return onInput(this);" onkeypress="return onFieldKey(event, this);"><span id="chargesign" style="margin-left: 5px;"><?php echo($cursign[1]); ?></span></td>
		</tr>

		<tr id="exchange" style="display: none;">
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
