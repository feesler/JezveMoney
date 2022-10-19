<?php
use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");	?>
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
                                <div class="trtype-menu trtype-menu-multi">
<?php	foreach($transMenu as $menuItem) {  ?>
<?php       if ($menuItem->type == 0) {		?>
<?php           if ($menuItem->selected) {		?>
                                <span class="trtype-menu__item trtype-menu_item_title" data-type="<?=e($menuItem->type)?>">
<?php		    } else {		?>
                                <span class="trtype-menu__item trtype-menu_item_title trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
<?php	    	}				?>
                                    <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                </span>
<?php		} else {		?>
                                <label class="checkbox trtype-menu__item" data-type="<?=e($menuItem->type)?>">
                                    <input type="checkbox"<?=checked($menuItem->selected)?>>
                                    <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                                    <span class="checkbox__label">
                                        <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                    </span>
                                </label>
<?php		}				?>
<?php	}			?>
                                </div>
                            </div>

                            <div class="filter-item std_margin">
                                <h3 class="filter-item__title">Report type</h3>
                                <div id="report_menu" class="link-menu">
<?php	foreach($reportMenu as $item) {	    ?>
<?php		if ($item["selected"]) {		?>
                                    <b class="link-menu-item link-menu-item_active" data-value="<?=e($item["value"])?>">
                                        <span class="link-menu-item__title"><?=e($item["title"])?></span>
                                    </b>
<?php		} else {	?>
                                    <a class="link-menu-item" href="<?=e($item["url"])?>" data-value="<?=e($item["value"])?>">
                                        <span class="link-menu-item__title"><?=e($item["title"])?></span>
                                    </a>
<?php		}	?>
<?php	}	?>
                                </div>
                            </div>

                            <div id="acc_block" class="filter-item std_margin"<?=hidden($byCurrency)?>>
                                <h3 class="filter-item__title">Account</h3>
                                <select id="acc_id"></select>
                            </div>

                            <div id="curr_block" class="filter-item std_margin"<?=hidden(!$byCurrency)?>>
                                <h3 class="filter-item__title">Currency</h3>
                                <select id="curr_id"></select>
                            </div>

                            <div class="filter-item std_margin">
                                <h3 class="filter-item__title">Group by</h3>
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

                            <div id="dateFilter" class="filter-item std_margin">
                                <h3 class="filter-item__title">Date range</h3>
                                <div class="input-group">
                                    <input id="date" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?=e($dateFmt)?>">
                                    <button id="nodatebtn" class="input-group__inner-btn" type="button"<?=hidden(is_empty($dateFmt))?>>
                                        <?=svgIcon("close", "input-group__inner-btn__icon")?>
                                    </button>
                                    <button id="cal_rbtn" class="btn icon-btn input-group__btn" type="button">
                                        <?=useIcon("calendar-icon", "icon calendar-icon")?>
                                    </button>
                                </div>
                                <div id="calendar" class="calendar"></div>
                            </div>
                        </div>

                        <div id="chart" class="stat-histogram">
                            <span class="nodata-message" hidden>No results found.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(ICONS_PATH . "Common.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
