<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Statistics</h1>
                    </div>

                    <div>
                        <div class="trtype-menu">
<?php	forEach($transMenu as $menuItem) {
            if ($menuItem->selected) {		?>
                            <span class="trtype-menu__item trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
                                <span class="trtype-menu_item_title"><?=e($menuItem->title)?></span>
                            </span>
<?php		} else {		?>
                            <span class="trtype-menu__item" data-type="<?=e($menuItem->type)?>">
                                <span class="trtype-menu_item_title">
                                    <a href="<?=e($menuItem->link)?>"><?=e($menuItem->title)?></a>
                                </span>
                            </span>
<?php		}
        }	?>
                        </div>

                        <div class="std_margin filters-container">
                            <div class="filter-item">
                                <select id="filter_type">
<?php	foreach($byCurrArr as $ind => $byCurrItem) {	?>
<?php		if ($byCurrItem["selected"]) {		?>
                                    <option value="<?=e($ind)?>" selected><?=e($byCurrItem["title"])?></option>
<?php		} else {	?>
                                    <option value="<?=e($ind)?>"><?=e($byCurrItem["title"])?></option>
<?php		}	?>
<?php	}	?>
                                </select>
                            </div>

<?php	if ($byCurrency) {		?>
                            <div id="acc_block" class="filter-item hidden">
<?php	} else {	?>
                            <div id="acc_block" class="filter-item">
<?php	}	?>
                                <select id="acc_id">
<?php	foreach($accArr as $accInfo) {
            if ($accInfo->id == $acc_id) {	?>
                                    <option value="<?=e($accInfo->id)?>" selected><?=e($accInfo->name)?></option>
<?php		} else {	?>
                                    <option value="<?=e($accInfo->id)?>"><?=e($accInfo->name)?></option>
<?php		}
        }		?>
                                </select>
                            </div>

<?php	if ($byCurrency) {		?>
                            <div id="curr_block" class="filter-item">
<?php	} else {	?>
                            <div id="curr_block" class="filter-item hidden">
<?php	}	?>
                                <select id="curr_id">
<?php	foreach($currArr as $currInfo) {
            if ($currInfo->id == $curr_id) {	?>
                                    <option value="<?=e($currInfo->id)?>" selected><?=e($currInfo->name)?></option>
<?php		} else {	?>
                                    <option value="<?=e($currInfo->id)?>"><?=e($currInfo->name)?></option>
<?php		}
        }		?>
                                </select>
                            </div>

                            <div class="filter-item">
                                <select id="groupsel">
<?php	foreach($groupTypes as $val => $grtype) {	?>
<?php		if ($val == $groupType_id) {		?>
                                    <option value="<?=e($val)?>" selected><?=e($grtype)?></option>
<?php		} else { ?>
                                    <option value="<?=e($val)?>"><?=e($grtype)?></option>
<?php		} ?>
<?php	}	?>
                                </select>
                            </div>

                            <div class="filter-item">
<?php	if (is_empty($dateFmt)) {		?>
                                <div id="calendar_btn" class="iconlink std_margin">
                                    <button type="button">
                                        <span class="iconlink__icon"><?=svgIcon("cal")?></span>
                                        <span class="iconlink__content"><span>Select range</span></span>
                                    </button>
                                </div>
<?php	} else { 	?>
                                <div id="calendar_btn" class="iconlink std_margin">
                                    <button type="button">
                                        <span class="iconlink__icon"><?=svgIcon("cal")?></span>
                                        <span class="iconlink__content">
                                            <span class="iconlink__title">Select range</span>
                                            <span class="iconlink__subtitle"><?=e($dateFmt)?></span>
                                        </span>
                                    </button>
                                </div>
<?php	} 	?>
                                <div id="date_block" class="hidden">
                                    <div class="input-group">
                                        <div class="stretch-input rbtn_input">
                                            <input id="date" name="date" type="text" value="<?=e($dateFmt)?>">
                                        </div>
                                        <button id="cal_rbtn" class="btn icon-btn" type="button"><?=svgIcon("cal")?></button>
                                    </div>
                                    <div id="calendar"></div>
                                </div>
                            </div>
                        </div>

                        <div id="chart" class="stat-histogram">
<?php	if (!$statArr || !is_array($statArr->values) || !count($statArr->values)) {	?>
                            <span>No results found.</span>
<?php	}		?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>
    var currency = <?=JSON::encode($currArr)?>;
    var accCurr = <?=$accCurr?>;
    var filterObj = <?=JSON::encode($filterObj)?>;
    var chartData = <?=JSON::encode($statArr)?>;

    var view = new StatisticsView();
</script>
</body>
</html>
