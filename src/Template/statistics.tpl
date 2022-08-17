<?php
use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Statistics</h1>
                    </div>

                    <div>
                        <div class="filters-container">
                            <div class="filter-item std_margin">
                                <h3 class="filter-item__title">Type</h3>
                                <div class="trtype-menu">
<?php	forEach($transMenu as $menuItem) {
            if ($menuItem->selected) {		?>
                                    <span class="trtype-menu__item trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
                                        <span class="trtype-menu_item_title"><?=e($menuItem->title)?></span>
                                    </span>
<?php		} else {		?>
                                    <span class="trtype-menu__item" data-type="<?=e($menuItem->type)?>">
                                        <span class="trtype-menu_item_title">
                                            <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                        </span>
                                    </span>
<?php		}
        }	?>
                                </div>
                            </div>

                            <div class="filter-item std_margin">
                                <h3 class="filter-item__title">Filter by</h3>
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

                            <div id="acc_block" class="filter-item std_margin"<?=hidden($byCurrency)?>>
                                <h3 class="filter-item__title">Account</h3>
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

                            <div id="curr_block" class="filter-item std_margin"<?=hidden(!$byCurrency)?>>
                                <h3 class="filter-item__title">Currency</h3>
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

                            <div class="filter-item std_margin">
                                <h3 class="filter-item__title">Type</h3>
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

                            <div class="filter-item std_margin">
                                <?=IconLink::render([
                                    "id" => "calendar_btn",
                                    "icon" => "cal",
                                    "title" => "Select range",
                                    "subtitle" => $dateFmt
                                ])?>
                                <div id="date_block" hidden>
                                    <div class="input-group">
                                        <input id="date" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?=e($dateFmt)?>">
                                        <button id="nodatebtn" class="input-group__inner-btn" type="button">
                                            <?=svgIcon("close", "input-group__inner-btn__icon")?>
                                        </button>
                                        <button id="cal_rbtn" class="icon-btn input-group__btn" type="button"><?=svgIcon("cal", "icon calendar-icon")?></button>
                                    </div>
                                    <div id="calendar" class="calendar"></div>
                                </div>
                            </div>
                        </div>

                        <div id="chart" class="stat-histogram">
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

<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
