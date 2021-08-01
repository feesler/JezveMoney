<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap main-view">
                    <div class="widget accounts-widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>accounts/">
                                <span>Accounts</span>
                                <div class="glyph"><?=svgIcon("glyph")?></div>
                            </a>
                        </div>
                        <div class="tiles">
<?php   if (!count($tilesArr)) {	?>
                            <span class="nodata-message">You have no one account. Please create one.</span>
<?php	} else {
            foreach($tilesArr as $acc_id => $tile) {    ?>
                            <div class="tile" data-id="<?=e($acc_id)?>">
                                <a href="<?=BASEURL?>transactions/new/?acc_id=<?=e($acc_id)?>" class="tilelink">
                                    <span>
                                        <span class="tile__subtitle"><?=e($tile["balance"])?></span>
                                        <span class="tile__icon"><?=useIcon($tile["icon"], 60, 54)?></span>
                                        <span class="tile__title"><?=e($tile["name"])?></span>
                                    </span>
                                </a>
                            </div>
<?php       }
        }	?>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget_title">
                            <span>Total</span>
                        </div>
                        <div class="info-tiles">
<?php	if (!count($tilesArr)) {	?>
                            <span class="nodata-message">You have no one account. Please create one.</span>
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
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>transactions/">
                                <span>Transactions</span>
                                <div class="glyph"><?=svgIcon("glyph")?></div>
                            </a>
                        </div>
                        <div id="trlist" class="trans-list">
<?php	if (!count($trListData)) {	?>
                            <span class="nodata-message">You have no one transaction yet.</span>
<?php	} else if (!count($tilesArr)) {	?>
                            <span class="nodata-message">You have no one account. Please create one.</span>
<?php	} else {	?>
<?php		foreach($trListData as $trItem) {	?>
                            <div class="trans-list__item-wrapper">
                                <div class="trans-list__item" data-id="<?=e($trItem["id"])?>">
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
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>persons/">
                                <span>Persons</span>
                                <div class="glyph"><?=svgIcon("glyph")?></div>
                            </a>
                        </div>
                        <div class="info-tiles">
<?php	if (!count($persArr)) {		?>
                            <span class="nodata-message">No persons here.</span>
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
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>statistics/">
                                <span>Statistics</span>
                                <div class="glyph"><?=svgIcon("glyph")?></div>
                            </a>
                        </div>
                        <div id="chart" class="widget_charts">
<?php	if (!$statArr || !is_array($statArr->values) || !count($statArr->values)) {	?>
                            <span class="nodata-message">No results found.</span>
<?php	}		?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
