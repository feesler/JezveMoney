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
<?php		if ($showDetails) {		?>
								<a class="list_mode" href="<?=e($linkStr)?>"><span class="icon"></span><span>Classic</span></a><b class="details_mode"><span class="icon"></span><span>Details</span></b>
<?php		} else {		?>
								<b class="list_mode"><span class="icon"></span><span>Classic</span></b><a class="details_mode" href="<?=e($linkStr)?>"><span class="icon"></span><span>Details</span></a>
<?php		}	?>
							</div>
<?php	}	?>
<?php	if ($trParams["onPage"] > 0 && $showPaginator == TRUE) {		?>
							<div class="paginator"><?php
			foreach($pagesArr as $pageItem) {
				if (!is_numeric($pageItem["text"])) {
					?><span><?=e($pageItem["text"])?></span><?php
				} else if ($pageItem["active"]) {
					?><span><b><?=e($pageItem["text"])?></b></span><?php
				} else {
					?><span><a href="<?=e($pageItem["link"])?>"><?=e($pageItem["text"])?></a></span><?php
				}
			}	?></div>
<?php	}	?>
<?php	if ($showDetails) {	?>
							<table id="tritems" class="details_table">
<?php	} else {	?>
							<div id="tritems">
<?php	}	?>
<?php	foreach($trListData as $trItem) {	?>
<?php	if ($showDetails) {		?>
								<tbody class="trlist_item_wrap"><tr id="tr_<?=e($trItem["id"])?>">
									<td><div class="ellipsis_cell"><div class="tritem_acc_name" title="<?=e($trItem["acc"])?>"><span><?=e($trItem["acc"])?></span></div></div></td>
									<td><div class="tritem_sum"><span><?=e($trItem["amount"])?></span></div></td>
									<td><div class="tritem_balance">
										<span><?=implode("</span><span>", array_map("e", $trItem["balance"]))?></span>
									</div></td>
									<td>
										<div class="tritem_date_comm">
											<span><?=e($trItem["date"])?></span>
										</div>
									</td>
									<td><div class="ellipsis_cell">
<?php		if ($trItem["comment"] != "") {		?>
										<div title="<?=e($trItem["comment"])?>"><span class="tritem_comm"><?=e($trItem["comment"])?></span></div>
<?php		} else {		?>
										<div></div>
<?php		}	?>
									</div></td>
								</tr></tbody>
<?php	} else {		?>
							<div class="trlist_item_wrap">
								<div id="tr_<?=e($trItem["id"])?>" class="trlist_item">
									<div class="tritem_acc_name"><span><?=e($trItem["acc"])?></span></div>
									<div class="tritem_sum"><span><?=e($trItem["amount"])?></span></div>
									<div class="tritem_date_comm">
										<span><?=e($trItem["date"])?></span>
<?php		if ($trItem["comment"] != "") {		?>
										<span class="tritem_comm"><?=e($trItem["comment"])?></span>
<?php		}	?>
									</div>
								</div>
							</div>
<?php	}	?>
<?php	}	?>
<?php	if ($showDetails) {		?>
						</table>
<?php	} else {	?>
						</div>
<?php	}	?>
<?php	if ($trParams["onPage"] > 0 && $showPaginator == TRUE) {		?>
							<div class="paginator"><?php
			foreach($pagesArr as $pageItem) {
				if (!is_numeric($pageItem["text"])) {
					?><span><?=e($pageItem["text"])?></span><?php
				} else if ($pageItem["active"]) {
					?><span><b><?=e($pageItem["text"])?></b></span><?php
				} else {
					?><span><a href="<?=e($pageItem["link"])?>"><?=e($pageItem["text"])?></a></span><?php
				}
			}	?></div>
<?php	}	?>
<?php	}	?>
						</div>
