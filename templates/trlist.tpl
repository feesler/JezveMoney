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

<?php	foreach($trListData as $trItem) {	?>
<?php	if ($details) {		?>
								<tbody><tr id="tr_<?=$trItem["id"]?>">
<?php	} else {		?>
							<div class="trlist_item_wrap">
								<div id="tr_<?=$trItem["id"]?>" class="trlist_item">
<?php	}		?>
<?php	if ($details) {	?>
									<td><div class="ellipsis_cell"><div class="tritem_acc_name" title="<?=$trItem["acc"]?>"><span><?=$trItem["acc"]?></span></div></div></td>
<?php	} else {	?>
									<div class="tritem_acc_name"><span><?=$trItem["acc"]?></span></div>
<?php	}	?>
<?php	if ($details) {	?>
									<td><div class="tritem_sum"><span><?=$trItem["amount"]?></span></div></td>
<?php	} else {	?>
									<div class="tritem_sum"><span><?=$trItem["amount"]?></span></div>
<?php	}	?>
<?php	if ($details) {		?>
									<td><div class="tritem_balance">
<?php		foreach($trItem["balance"] as $balStr) {	?>
										<span><?=$balStr?></span>
<?php		}	?>
									</div></td>
<?php	}	?>
<?php	if ($details) {		?>
									<td>
<?php	}	?>
										<div class="tritem_date_comm">
											<span><?=$trItem["date"]?></span>
<?php	if ($details) {		?>
										</div>
									</td>
									<td><div class="ellipsis_cell">
<?php		if ($trItem["comm"] != "") {		?>
										<div title="<?=$trItem["comm"]?>">
<?php		} else {		?>
										<div>
<?php		}	?>
<?php	}	?>
<?php	if ($trItem["comm"] != "") {		?>
											<span class="tritem_comm"><?=$trItem["comm"]?></span>
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
