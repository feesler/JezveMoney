						<div id="trlist" class="trans_list">
<?php	if (!$accounts) {		?>
							<span>You have no one account. Please create one.</span>
<?php	} else if (!$totalTrCount) {	?>
							<span>You have no one transaction yet.</span>
<?php	} else if (!count($transArr)) {	?>
							<span>No transactions found.</span>
<?php	} else {		?>
<?php	if ($showPaginator == TRUE) {		?>
							<div class="mode_selector">
<?php		if ($details) {		?>
								<a class="list_mode" href="<?=$linkStr?>"><span class="icon"></span><span>Classic</span></a><b class="details_mode"><span class="icon"></span><span>Details</span></b>
<?php		} else {		?>
								<b class="list_mode"><span class="icon"></span><span>Classic</span></b><a class="details_mode" href="<?=$linkStr?>"><span class="icon"></span><span>Details</span></a>
<?php		}	?>
							</div>
<?php	}	?>
<?php	if ($tr_on_page > 0 && $showPaginator == TRUE) {		?>
							<div class="paginator">
<?php		foreach($pagesArr as $pageItem) {		?>
<?php			if (!is_numeric($pageItem["text"])) {		?>
								<span><?=$pageItem["text"]?></span>
<?php			} else if ($pageItem["active"]) {		?>
								<span><b><?=$pageItem["text"]?></b></span>
<?php			} else {		?>
								<span><a><?=$pageItem["text"]?></a></span>
<?php			}	?>
<?php		}	?>
							</div>
<?php	}	?>
<?php	if ($details) {	?>
							<table class="details_table">
<?php	}	?>

<?php
	foreach($transArr as $trans)
	{
		$trans_id = $trans[0];
		$src_id = $trans[1];
		$dest_id = $trans[2];
		$famount = $trans[3];
		$fcharge = $trans[4];
		$cur_trans_type = $trans[5];
		$fdate = $trans[6];
		$comment = $trans[7];

		if ($details)
		{
			$src_balance = $trans[9];
			$dest_balance = $trans[10];
		}

		if ($cur_trans_type == 4)
		{
			$src_owner_id = $acc->getOwner($src_id);
			$dest_owner_id = $acc->getOwner($dest_id);
		}
?>
<?php	if ($details) {		?>
								<tbody><tr id="tr_<?=$trans_id?>">
<?php	} else {		?>
							<div class="trlist_item_wrap">
								<div id="tr_<?=$trans_id?>" class="trlist_item">
<?php	}		?>
<?php
		// Make accounts string
		$accStr = "";
		if ($src_id != 0)
		{
			if ($cur_trans_type == 1 || $cur_trans_type == 3)		// expense or transfer
				$accStr .= $acc->getName($src_id);
			else if ($cur_trans_type == 4)
				$accStr .= $acc->getNameOrPerson($src_id);
		}

		if ($src_id != 0 && $dest_id != 0 && ($cur_trans_type == 3 || $cur_trans_type == 4))
			$accStr .= " → ";

		if ($dest_id != 0)
		{
			if ($cur_trans_type == 2 || $cur_trans_type == 3)		// income or transfer
				$accStr .= $acc->getName($dest_id);
			else if ($cur_trans_type == 4)
				$accStr .= $acc->getNameOrPerson($dest_id);
		}
?>
<?php	if ($details) {	?>
									<td><div class="ellipsis_cell"><div class="tritem_acc_name" title="<?=$accStr?>"><span><?=$accStr?></span></div></div></td>
<?php	} else {	?>
									<div class="tritem_acc_name"><span><?=$accStr?></span></div>
<?php	}	?>
<?php
		$amStr = $famount;
		if ($famount != $fcharge)
			$amStr .= " (".$fcharge.")";
?>
<?php	if ($details) {	?>
									<td><div class="tritem_sum"><span><?=$amStr?></span></div></td>
<?php	} else {	?>
									<div class="tritem_sum"><span><?=$amStr?></span></div>
<?php	}	?>
<?php	if ($details) {		?>
									<td><div class="tritem_balance">
<?php
			if ($cur_trans_type == 1 || $cur_trans_type == 2) {
				$tr_acc_id = ($cur_trans_type == 1) ? $src_id : $dest_id;

				$balance = ($cur_trans_type == 1) ? $src_balance : $dest_balance;
				$acc_curr = $acc->getCurrency($tr_acc_id);
?>
										<span><?=Currency::format($balance, $acc_curr)?></span>
<?php
			}
			else if ($cur_trans_type == 3 || $cur_trans_type == 4)
			{
				if ($src_id != 0)
				{
					$acc_curr = $acc->getCurrency($src_id);
?>
										<span><?=Currency::format($src_balance, $acc_curr)?></span>
<?php
				}

				if ($dest_id != 0)
				{
					$acc_curr = $acc->getCurrency($dest_id);
?>
										<span><?=Currency::format($dest_balance, $acc_curr)?></span>
<?php
				}
			}
?>
									</div></td>
<?php	}	?>
<?php	if ($details) {		?>
									<td>
<?php	}	?>
										<div class="tritem_date_comm">
											<span><?=$fdate?></span>
<?php	if ($details) {		?>
										</div>
									</td>
									<td><div class="ellipsis_cell">
<?php		if ($comment != "") {		?>
										<div title="<?=$comment?>">
<?php		} else {		?>
										<div>
<?php		}	?>
<?php	}	?>
<?php	if ($comment != "") {		?>
											<span class="tritem_comm"><?=$comment?></span>
<?php	}	?>
										</div>
<?php	if ($details) {		?>
									</div></td>
								</tr></tbody>
<?php	} else {		?>
								</div>
							</div>
<?php	}	?>
<?php	}	?>
<?php	if ($details) {		?>
					</table>
<?php	}	?>
<?php	if ($tr_on_page > 0 && $showPaginator == TRUE) {		?>
							<div class="paginator">
<?php		foreach($pagesArr as $pageItem) {		?>
<?php			if (!is_numeric($pageItem["text"])) {		?>
								<span><?=$pageItem["text"]?></span>
<?php			} else if ($pageItem["active"]) {		?>
								<span><b><?=$pageItem["text"]?></b></span>
<?php			} else {		?>
								<span><a><?=$pageItem["text"]?></a></span>
<?php			}	?>
<?php		}	?>
							</div>
<?php	}	?>
<?php	}	?>
				</div>
