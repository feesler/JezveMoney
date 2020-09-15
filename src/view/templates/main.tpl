<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
		<div class="container centered">
			<div class="content">
				<div class="content_wrap main-view">
					<div class="widget accounts-widget">
						<div class="widget_title"><a href="<?=BASEURL?>accounts/"><span>Accounts</span><div class="glyph"><?=svgIcon("glyph")?></div></a></div>
						<div class="tiles"><?php
		if (!count($tilesArr)) {	?>
						<span>You have no one account. Please create one.</span>
<?php	} else {
			foreach($tilesArr as $acc_id => $tile) {
?><div id="acc_<?=e($acc_id)?>" class="tile<?=e($tile["icon"])?>"><a href="<?=BASEURL?>transactions/new/?acc_id=<?=e($acc_id)?>" class="tilelink"><span><span class="tile__subtitle"><?=e($tile["balance"])?></span><span class="tile__icon"><?=useIcon("tile-".$tile["iconname"], 60, 54)?></span><span class="tile__title"><?=e($tile["name"])?></span></span></a></div><?php
			}
		}	?></div>
					</div>

					<div class="widget">
						<div class="widget_title"><span>Total</span></div>
						<div class="info-tiles">
<?php	if (!count($tilesArr)) {	?>
							<span>You have no one account. Please create one.</span>
<?php	} else {	?>
<?php		foreach($totalsArr as $curr_id => $currData) {	?>
							<div class="info-tile">
								<span class="info-tile__title"><?=e($currData["name"])?></span>
								<span class="info-tile__subtitle"><?=e($currData["balfmt"])?></span>
							</div>
<?php		}	?>
<?php	}	?>
						</div>
					</div>

					<div class="widget transactions-widget">
						<div class="widget_title"><a href="<?=BASEURL?>transactions/"><span>Transactions</span><div class="glyph"><?=svgIcon("glyph")?></div></a></div>
						<div id="trlist" class="trans-list">
<?php	if (!count($trListData)) {	?>
							<span>You have no one transaction yet.</span>
<?php	} else if (!count($tilesArr)) {	?>
							<span>You have no one account. Please create one.</span>
<?php	} else {	?>
<?php		foreach($trListData as $trItem) {	?>
							<div class="trans-list__item-wrapper">
								<div id="tr_<?=e($trItem["id"])?>" class="trans-list__item">
									<div class="trans-list__item-title"><span><?=e($trItem["acc"])?></span></div>
									<div class="trans-list__item-content"><span><?=e($trItem["amount"])?></span></div>
									<div class="trans-list__item-details">
										<span><?=e($trItem["date"])?></span>
<?php		if ($trItem["comment"] != "") {		?>
										<span class="trans-list__item-comment"><?=e($trItem["comment"])?></span>
<?php		}	?>
									</div>
								</div>
							</div>
<?php		}	?>
<?php	}	?>
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="<?=BASEURL?>persons/"><span>Persons</span><div class="glyph"><?=svgIcon("glyph")?></div></a></div>
						<div class="info-tiles">
<?php	if (!count($persArr)) {		?>
							<span>No persons here.</span>
<?php	} else {	?>
<?php		foreach($persArr as $pData) {	?>
							<div class="info-tile">
								<span class="info-tile__title"><?=e($pData->name)?></span>
<?php			if ($pData->nodebts) {		?>
								<span class="info-tile__subtitle">No debts</span>
<?php			} else {	?>
								<span class="info-tile__subtitle"><?=implode("<br>", array_map("e", $pData->balfmt))?></span>
<?php			}	?>
							</div>
<?php		}	?>
<?php	}	?>
						</div>
					</div>

					<div class="widget">
						<div class="widget_title"><a href="<?=BASEURL?>statistics/"><span>Statistics</span><div class="glyph"><?=svgIcon("glyph")?></div></a></div>
						<div id="chart" class="widget_charts"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
<script>
	var currency = <?=JSON::encode($currArr)?>;
	var accounts = <?=JSON::encode($accArr)?>;
	var persons = <?=JSON::encode($persArr)?>;
	var accCurr = <?=$curr_acc_id?>;
	var chartData = <?=JSON::encode($statArr)?>;

	onReady(initStatWidget);
</script>
</body>
</html>
