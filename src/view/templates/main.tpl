<?php	include("./view/templates/commonhdr.tpl");	?>
<script>
	var currency = <?=JSON::encode($currArr)?>;
	var accounts = <?=JSON::encode($accArr)?>;
	var persons = <?=JSON::encode($persArr)?>;
	var accCurr = <?=$curr_acc_id?>;
	var chartData = <?=JSON::encode($statArr)?>;

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
						<div class="widget_title"><a href="<?=BASEURL?>accounts/"><span>Accounts</span><div class="glyph"></div></a></div>
						<div class="tiles"><?php
		if (!count($tilesArr)) {	?>
						<span>You have no one account. Please create one.</span>
<?php	} else {
			foreach($tilesArr as $acc_id => $tile) {
?><div id="acc_<?=$acc_id?>" class="tile<?=$tile["icon"]?>"><a href="<?=BASEURL?>transactions/new/?acc_id=<?=$acc_id?>" class="tilelink"><span><span class="acc_bal"><?=$tile["balance"]?></span><span class="acc_name"><?=$tile["name"]?></span></span></a></div><?php
			}
		}	?></div>
					</div>

					<div class="widget">
						<div class="widget_title"><span>Total</span></div>
						<div class="info_tiles">
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

					<div class="widget break_widget latest_widget">
						<div class="widget_title"><a href="<?=BASEURL?>transactions/"><span>Transactions</span><div class="glyph"></div></a></div>
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
						<div class="widget_title"><a href="<?=BASEURL?>persons/"><span>Persons</span><div class="glyph"></div></a></div>
						<div class="info_tiles">
<?php	if (!count($persArr)) {		?>
							<span>No persons here.</span>
<?php	} else {	?>
<?php		foreach($persArr as $pData) {	?>
							<div class="info_tile">
								<span class="info_title"><?=$pData->name?></span>
<?php			if ($pData->nodebts) {		?>
								<span class="info_subtitle">No debts</span>
<?php			} else {	?>
								<span class="info_subtitle"><?=implode("<br>", $pData->balfmt)?></span>
<?php			}	?>
							</div>
<?php		}	?>
<?php	}	?>
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="<?=BASEURL?>statistics/"><span>Statistics</span><div class="glyph"></div></a></div>
						<div id="chart" class="charts widget_charts"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
