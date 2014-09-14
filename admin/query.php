<?php
	require_once("../setup.php");

	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");
?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<title>Admin panel | DB queries</title>
<script type="text/javascript" src="../js/common.js"></script>
<script>
</script>
</head>
<body>
<a href="./undex.php">Admin</a><br>
<a href="./currency.php">Currencies</a>  <b>Queries</b> <a href="./log.php">Logs</a> <a href="./apitest.php">API test</a>
<?php
/*
	if (isset($_GET["add"]))
	{
		if ($_GET["add"] == "ok")
			<span style=\"color: green;\">Currency was succussfully created</span><br>
		else if ($_GET["add"] == "fail")
			<span style=\"color: red;\">Fail to create new currency</span><br>
	}
	else 	if (isset($_GET["edit"]))
	{
		if ($_GET["edit"] == "ok")
			<span style=\"color: green;\">Currency was succussfully updated</span><br>
		else if ($_GET["edit"] == "fail")
			<span style=\"color: red;\">Fail to update new currency</span><br>
	}
	else 	if (isset($_GET["del"]))
	{
		if ($_GET["del"] == "ok")
			<span style=\"color: green;\">Currency was succussfully deleted</span><br>
		else if ($_GET["del"] == "fail")
			<span style=\"color: red;\">Fail to delete new currency</span><br>
	}
*/

	$query = "";
	if (isset($_POST["query"]))
	{
		$query = $_POST["query"];

		if (isset($_POST["qtype"]) && $_POST["qtype"] == "1")		// select query
		{
			$resArr = array();
			$result = $db->rawQ($query);
			$qerr_num = mysql_errno();
			$qerror = mysql_error();
			if ($result && !$qerr_num && mysql_num_rows($result) > 0) {
				while($row = mysql_fetch_array($result, MYSQL_ASSOC))
					$resArr[] = $row;
?>

				<table border="1">
				<tr>
<?php	foreach($resArr[0] as $ind => $val) {		?>
					<th><?=$ind?></th>
<?php	}	?>
				</tr>
<?php	foreach($resArr as $row) {		?>
				<tr>
<?php		foreach($row as $val) {	?>
					<td><?=$val?></td>
<?php		}	?>
				</tr>
<?php	}
				$rows = count($resArr);
				$cols = $rows ? count($row) : 0;
?>
				<tr><td colspan="<?=$cols?>">Rows: <?=$rows?></td></tr>
				</table>
<?php			} else {	?>
				<div style="color: red;">Error: <?=$qerr_num?><br><?=$qerror?></div><br>
<?php			}	?>
<?php		}	?>
<?php	}	?>
<form method="post" action="./query.php">
<label>Query type</label><br>
<input name="qtype" type="radio" value="1" checked> Select

<label>Query</label><br>
<textarea id="query" name="query" rows="5" cols="80"><?=$query?></textarea><br>
<input type="submit" value="Query">
</form>

</body>
</html>
