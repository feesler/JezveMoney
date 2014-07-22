<?php	include("./templates/commonhdr.tpl");	?>
<script>
	var currency = <?=f_json_encode($currArr)?>;
	var accCurr = <?=$curr_acc_id?>;
	var transType = <?=f_json_encode($type_str)?>;
	var groupType = <?=f_json_encode($groupType)?>;
	var chartData = <?=f_json_encode($statArr)?>;

<?php	if (isMessageSet()) {		?>
	onReady(initMessage);
<?php	}	?>
	onReady(initStatWidget);
</script>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once("./templates/header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap">
					<div class="widget">
						<div class="widget_title"><a href="./accounts.php">Accounts &gt;</a></div>
						<div class="tiles"><?php
	if (count($tilesArr)) {
		foreach($tilesArr as $acc_id => $tile) {
?><div id="acc_<?=$acc_id?>" class="tile<?=$tile["icon"]?>"><a href="./newtransaction.php?acc_id=<?=$acc_id?>" class="tilelink"><span><span class="acc_bal"><?=$tile["balance"]?></span><span class="acc_name"><?=$tile["name"]?></span></span></a></div><?php
		}
	} else {	?>
						<span>You have no one account. Please create one.</span>
<?php
	}
?></div>
					</div>

					<div class="widget">
						<div class="widget_title">Total &gt;</div>
						<div class="info_tiles">
							<div>
<?php	foreach($totalsArr as $curr_id => $currData) {	?>
								<div class="info_tile">
									<span class="info_title"><?=$currData["name"]?></span>
									<span class="info_subtitle"><?=$currData["balfmt"]?></span>
								</div>
<?php	}	?>
							</div>
						</div>
					</div>

					<div class="widget break_widget latest_widget">
						<div class="widget_title"><a href="./transactions.php">Latest &gt;</a></div>
						<div id="trlist" class="trans_list">
<?php	foreach($trListData as $trItem) {	?>
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
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="./persons.php">Persons &gt;</a></div>
						<div class="info_tiles">
							<div>
<?php	foreach($persArr as $pData) {	?>
								<div class="info_tile">
									<span class="info_title"><?=$pData[1]?></span>
<?php		if ($pData["nodebts"]) {		?>
									<span class="info_subtitle">No debts</span>
<?php		} else {	?>
									<span class="info_subtitle"><?=implode("<br>", $pData["balfmt"])?></span>
<?php		}	?>
								</div>
<?php	}	?>
							</div>
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="./statistics.php">Statistics &gt;</a></div>
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
