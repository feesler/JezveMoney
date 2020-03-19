<?php	include(TPL_PATH."commonhdr.tpl");	?>
<style>
table{border-collapse:collapse;}
td{ padding: 2px 5px; border:1px solid #000000; }
.id_cell{ background-color: #D0D0D0; }
.id_cell > a{ text-decoration: none; }
input[type="button"]{ border: 0 none; padding: 2px 5px; }
.sum_cell{ text-align: right; }
.act_sum{ background-color: #B0FFB0; }
.bad_val{ background-color: #FFB0B0; }
</style>
</head>
<body>
<?php	if ($fixed) {	?>
	<span style="color: #80FF80;">Balance value was fixed</span><br>
<?php	}	?>
<?php	if (isset($posUpd)) {		?>
<?php		if ($posUpd == TRUE) {	?>
	<span style="color: #80FF80;">Position was updated</span><br>
<?php		} else if ($posUpd == FALSE) {	?>
	<span style="color: #FF8080;">Fail to update position</span><br>
<?php		}	?>
<?php	}	?>
<table>
<?php	if ($checkAccount_id == 0) {	?>
	<tr><td colspan="9">All accounts</td></tr>
<?php	}	?>
	<tr>
		<td colspan="9">
			<table>
				<tr><td>ID</td><td>Account</td><td>initBalance</td><td>curBalance</td></tr>
<?php	foreach($this->accName as $acc_id => $acc_name) {		?>
				<tr>
					<td><?=e($acc_id)?></td>
					<td><?=e($acc_name)?></td>
					<td><?=e($initBalance[$acc_id])?></td>
					<td><?=e($curBalance[$acc_id])?></td>
				</tr>
<?php	}	?>
			</table>
		</td>
	</tr>

	<tr><td>ID</td><td>Type</td><td>Source amount</td><td>Destination amount</td><td>Comment</td><td>Source balance</td><td>Destination balance</td><td>Date</td><td>Pos</td></tr>
<?php	foreach($transArr as $tr) {	?>
	<tr>
		<td class="id_cell">
			<a href="<?=BASEURL?>transactions/edit/<?=e($tr->id)?>" target="_blank"><?=e($tr->id)?></a>
		</td>
<?php	if ($tr->type == EXPENSE) {		?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Expense from <?=e($this->getName($tr->src_id))?></td>
<?php		} else {	?>
		<td>Expense</td>
<?php		}	?>
<?php		if ($tr->src_amount == $tr->dest_amount) {	?>
		<td class="sum_cell" colspan="2">- <?=e($tr->dest_amount)?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=e($tr->src_amount)?></td><td class="sum_cell act_sum">- <?=e($tr->dest_amount)?></td>
<?php		}	?>
<?php	} else if ($tr->type == INCOME) {	?>
<?php		if ($checkAccount_id == 0) {	?>
		<td>Income to <?=e($this->getName($tr->dest_id))?></td>
<?php		} else {	?>
		<td>Income</td>
<?php		}	?>
<?php		if ($tr->src_amount == $tr->dest_amount) {	?>
		<td class="sum_cell" colspan="2">+ <?=e($tr->dest_amount)?></td>
<?php		} else {	?>
		<td class="sum_cell">+<?=e($tr->src_amount)?></td><td class="sum_cell act_sum">+ <?=e($tr->dest_amount)?></td>
<?php		}	?>
<?php	} else if ($checkAccount_id != 0 && $tr->type == TRANSFER && $tr->dest_id == $checkAccount_id) {	/* transfer to */	?>
		<td>Transfer from <?=e($this->getName($tr->src_id))?></td>
<?php		if ($tr->src_amount == $tr->dest_amount) {		?>
		<td class="sum_cell" colspan="2">+<?=e($tr->dest_amount)?></td>
<?php		} else {	?>
		<td class="sum_cell act_sum">+<?=e($tr->src_amount)?></td><td class="sum_cell">+<?=e($tr->dest_amount)?></td>
<?php		}	?>
<?php	} else if ($checkAccount_id != 0 && $tr->type == TRANSFER && $tr->src_id == $checkAccount_id) {		/* transfer from */	?>
		<td>Transfer to <?=e($this->getName($tr->dest_id))?></td>
<?php		if ($tr->src_amount == $tr->dest_amount) {		?>
		<td class="sum_cell" colspan="2">-<?=e($tr->dest_amount)?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=e($tr->src_amount)?></td><td class="sum_cell act_sum">-<?=e($tr->dest_amount)?></td>
<?php		}	?>
<?php	} else if ($checkAccount_id == 0 && $tr->type == TRANSFER) {		/* Transfer between two accounts */		?>
		<td>Transfer from <?=e($this->getName($tr->src_id))?> to <?=e($this->getName($tr->dest_id))?></td>
<?php		if ($tr->src_amount == $tr->dest_amount) {		?>
		<td class="sum_cell" colspan="2">-<?=e($tr->dest_amount)?></td>
<?php		} else {	?>
		<td class="sum_cell">-<?=e($tr->src_amount)?></td><td class="sum_cell act_sum">+ <?=e($tr->dest_amount)?></td>
<?php		}	?>
<?php	} else if ($tr->type == DEBT) {		?>
		<td>Debt from <?=e($this->getName($tr->src_id))?> to <?=e($this->getName($tr->dest_id))?></td>
<?php		if ($tr->src_amount == $tr->dest_amount) {	?>
		<td class="sum_cell" colspan="2">-<?=e($tr->dest_amount)?></td>
<?php		} else {		?>
		<td class="sum_cell">- <?=e($tr->src_amount)?></td><td class="sum_cell act_sum">+ <?=e($tr->dest_amount)?></td>
<?php		}	?>
<?php	}	?>
		<td><?=e($tr->comment)?></td>
<?php	$cspan = ($tr->src_id && $tr->dest_id) ? "" : " colspan=\"2\"";

		if ($tr->src_id) {
			if ($tr->realbal[ $tr->src_id ] < 0.0) {	?>
		<td class="sum_cell bad_val"<?=$cspan?>><?=e($tr->realbal[ $tr->src_id ])?></td>
<?php		} else {		?>
		<td class="sum_cell"<?=$cspan?>><?=e($tr->realbal[ $tr->src_id ])?></td>
<?php		}
		}

		if ($tr->dest_id) {
			if ($tr->realbal[ $tr->dest_id ] < 0.0) {	?>
		<td class="sum_cell bad_val"<?=$cspan?>><?=e($tr->realbal[ $tr->dest_id ])?></td>
<?php		} else {		?>
		<td class="sum_cell"<?=$cspan?>><?=e($tr->realbal[ $tr->dest_id ])?></td>
<?php		}
		}

		if (!$tr->correctdate) {		?>
		<td class="bad_val"><?=e($tr->datefmt)?></td>
<?php	} else {	?>
		<td><?=e($tr->datefmt)?></td>
<?php	}		?>
		<td id="tr_<?=e($tr->id)?>"><input type="button" value="<?=e($tr->pos)?>"></td>
	</tr>
<?php	}		?>
	<tr>
		<td colspan="9">
			<table>
				<tr><td>ID</td><td>Account</td><td>realBalance</td><td>diference</td></tr>
<?php	foreach($balanceDiff as $acc_id => $bdiff) {	?>
<?php		if ($checkAccount_id == 0 || ($checkAccount_id != 0 && $checkAccount_id == $acc_id)) {		?>
				<tr>
					<td><?=e($acc_id)?></td>
					<td><?=e($this->accName[$acc_id])?></td>
					<td><?=e($realBalance[$acc_id])?></td>
					<td><?=e($bdiff)?></td>
				</tr>
<?php		}	?>
<?php	}	?>
			</table>
		</td>
	</tr>
</table>

<?php	if ($checkAccount_id != 0 && $balanceDiff[$checkAccount_id] != 0) {	?>
<form method="post" action="./checkbalance.php?id=<?=e($checkAccount_id)?>&act=fix">
<input name="fixbal" type="hidden" value="<?=e($realBalance[$checkAccount_id])?>">
<input type="submit" value="Fix balance">
</form>
<?php	}	?>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var account_id = <?=JSON::encode($checkAccount_id)?>;
</script>
</body>
</html>