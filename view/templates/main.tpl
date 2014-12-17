<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var currency = <?=f_json_encode($currArr)?>;
	var accCurr = <?=$curr_acc_id?>;
	var transType = <?=f_json_encode($type_str)?>;
	var groupType = <?=f_json_encode($groupType)?>;
	var chartData = <?=f_json_encode($statArr)?>;

	onReady(initStatWidget);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./view/templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="widget">
						<div class="widget_title"><a href="./accounts.php"><span>Accounts</span><div class="glyph"></div></a></div>
						<div class="tiles"><?php
		if (!count($tilesArr)) {	?>
						<span>You have no one account. Please create one.</span>
<?php	} else {
			foreach($tilesArr as $acc_id => $tile) {
?><div id="acc_<?=$acc_id?>" class="tile<?=$tile["icon"]?>"><a href="./transaction.php?act=new&amp;acc_id=<?=$acc_id?>" class="tilelink"><span><span class="acc_bal"><?=$tile["balance"]?></span><span class="acc_name"><?=$tile["name"]?></span></span></a></div><?php
			}
		}	?></div>
					</div>

					<div class="widget">
						<div class="widget_title"><span>Total</span></div>
						<div class="info_tiles">
							<div>
<?php	if (!count($tilesArr)) {	?>
								<span>You have no one account. Please create one.</span>
<?php	} else {	?>
<?php		foreach($totalsArr as $curr_id => $currData) {	?>
								<div class="info_tile">
									<span class="info_title"><?=$currData["name"]?></span>
									<span class="info_subtitle"><?=$currData["balfmt"]?></span>
								</div>
<?php		}	?>
<?php	}	?>
							</div>
						</div>
					</div>

					<div class="widget break_widget latest_widget">
						<div class="widget_title"><a href="./transactions.php"><span>Latest</span><div class="glyph"></div></a></div>
						<div id="trlist" class="trans_list">
<?php	if (!count($trListData)) {	?>
							<span>You have no one transaction yet.</span>
<?php	} else if (!count($tilesArr)) {	?>
							<span>You have no one account. Please create one.</span>
<?php	} else {	?>
<?php		foreach($trListData as $trItem) {	?>
							<div class="trlist_item_wrap">
								<div id="tr_<?=$trItem["id"]?>" class="trlist_item">
									<div class="tritem_acc_name"><span><?=$trItem["acc"]?></span></div>
									<div class="tritem_sum"><span><?=$trItem["amount"]?></span></div>
									<div class="tritem_date_comm">
										<span><?=$trItem["date"]?></span>
<?php		if ($trItem["comm"] != "") {		?>
										<span class="tritem_comm"><?=$trItem["comm"]?></span>
<?php		}	?>
									</div>
								</div>
							</div>
<?php		}	?>
<?php	}	?>
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="./persons.php"><span>Persons</span><div class="glyph"></div></a></div>
						<div class="info_tiles">
							<div>
<?php	if (!count($persArr)) {		?>
								<span>No persons here.</span>
<?php	} else {	?>
<?php		foreach($persArr as $pData) {	?>
								<div class="info_tile">
									<span class="info_title"><?=$pData[1]?></span>
<?php			if ($pData["nodebts"]) {		?>
									<span class="info_subtitle">No debts</span>
<?php			} else {	?>
									<span class="info_subtitle"><?=implode("<br>", $pData["balfmt"])?></span>
<?php			}	?>
								</div>
<?php		}	?>
<?php	}	?>
							</div>
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="./statistics.php"><span>Statistics</span><div class="glyph"></div></a></div>
						<div class="charts widget_charts">
							<div class="right_float">
								<div id="vert_labels"></div>
							</div>
							<div class="chart_wrap">
								<div class="chart_content">
									<div id="chart"></div>
								</div>
							</div>
							<div id="chpopup" class="chart_popup" style="display: none;"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
