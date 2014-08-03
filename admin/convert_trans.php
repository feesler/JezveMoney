<?php
	require_once("../setup.php");

	$u = new User();
	$user_id = $u->check();
	if (!$user_id || !$u->isAdmin($user_id))
		setLocation("../login.php");

	$u_id = $user_id;
	$acc = new Account($u_id, TRUE);

	$target_tbl = "transactions_dev";

	$fields = array("id",
				"user_id",
				"src_id",
				"dest_id",
				"type",
				"src_amount",
				"dest_amount",
				"src_curr",
				"dest_curr",
				"date",
				"comment",
				"pos");
?>
<!DOCTYPE html>
<html>
<head>
<title>Convert transactions</title>
</head>
<body>
<table border="1">
<tr>
	<th>id</th>
	<th>amount</th>
	<th>charge</th>
	<th>src_amount</th>
	<th>dest_amount</th>
	<th>curr_id</th>
	<th>src_curr</th>
	<th>dest_curr</th>
	<th>date</th>
	<th>comment</th>
</tr>
<?php

	$db->truncateQ($target_tbl);

	$trArr = $db->selectQ("*", "transactions", NULL, NULL, "id");
	foreach($trArr as $row)
	{
		$tr["id"] = intval($row["id"]);
		$tr["user_id"] = intval($row["user_id"]);
		$tr["src_id"] = intval($row["src_id"]);
		$tr["dest_id"] = intval($row["dest_id"]);
		$tr["type"] = intval($row["type"]);
		$tr["amount"] = floatval($row["amount"]);
		$tr["charge"] = floatval($row["charge"]);
		$tr["curr_id"] = intval($row["curr_id"]);
		$tr["date"] = $row["date"];
		$tr["comment"] = $row["comment"];
		$tr["pos"] = intval($row["pos"]);

		if ($u_id != $tr["user_id"])
		{
			$u_id = $tr["user_id"];
			$acc = new Account($u_id, TRUE);
		}

		if ($tr["type"] == 1)			// expense
		{
			$tr["src_amount"] = $tr["charge"];
			$tr["dest_amount"] = $tr["amount"];

			$tr["src_curr"] = $acc->getCurrency($tr["src_id"]);
			$tr["dest_curr"] = $tr["curr_id"];
		}
		else if ($tr["type"] == 2)		// income
		{
			$tr["src_amount"] = $tr["amount"];
			$tr["dest_amount"] = $tr["charge"];

			$tr["src_curr"] = $tr["curr_id"];
			$tr["dest_curr"] = $acc->getCurrency($tr["dest_id"]);
		}
		else if ($tr["type"] == 3)		// transfer
		{
			$tr["src_amount"] = $tr["charge"];
			$tr["dest_amount"] = $tr["amount"];

			$tr["src_curr"] = $acc->getCurrency($tr["src_id"]);
			$tr["dest_curr"] = $acc->getCurrency($tr["dest_id"]);
		}
		else if ($tr["type"] == 4)		// debt
		{
			$tr["src_owner"] = ($tr["src_id"] != 0) ? $acc->getOwner($tr["src_id"]) : 0;
			$tr["dest_owner"] = ($tr["dest_id"] != 0) ? $acc->getOwner($tr["dest_id"]) : 0;
			$tr["user_owner"] = $u->getOwner($tr["user_id"]);
			$give = ($tr["src_owner"] != 0 && $tr["src_owner"] != $tr["user_owner"]);

			if ($give)
			{
				$tr["src_amount"] = $tr["amount"];
				$tr["dest_amount"] = $tr["charge"];
			}
			else
			{
				$tr["src_amount"] = $tr["charge"];
				$tr["dest_amount"] = $tr["amount"];
			}

			$tr["src_curr"] = ($tr["src_id"] != 0) ? $acc->getCurrency($tr["src_id"]) : $tr["curr_id"];
			$tr["dest_curr"] = ($tr["dest_id"] != 0) ? $acc->getCurrency($tr["dest_id"]) : $tr["curr_id"];
		}

		$val = array(NULL,
					$tr["user_id"],
					$tr["src_id"],
					$tr["dest_id"],
					$tr["type"],
					$tr["src_amount"],
					$tr["dest_amount"],
					$tr["src_curr"],
					$tr["dest_curr"],
					$tr["date"],
					$db->escape($tr["comment"]),
					$tr["pos"]);

		if (!$db->insertQ("transactions_dev", $fields, $val))
		{
?>
			<div>Insert transaction <?=$tr["id"]?> error #<?=mysql_errno();?>: <?=mysql_error();?></div>
<?php
		}

?>
<tr>
	<td><?=$tr["id"]?></td>
	<td><?=$tr["amount"]?></td>
	<td><?=$tr["charge"]?></td>
	<td><?=$tr["src_amount"]?></td>
	<td><?=$tr["dest_amount"]?></td>
	<td><?=$tr["curr_id"]?></td>
	<td><?=$tr["src_curr"]?></td>
	<td><?=$tr["dest_curr"]?></td>
	<td><?=$tr["date"]?></td>
	<td><?=$tr["comment"]?></td>
</tr>
<?php
		
	}
?>
</table>
</body>
</html>