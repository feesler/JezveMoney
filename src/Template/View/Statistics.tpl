<?php
use JezveMoney\App\Template\Component\DateRangeInput;
use JezveMoney\App\Template\Component\LinkMenu;

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
                            <div class="filter-item">
                                <h3 class="filter-item__title">Type</h3>
                                <?= LinkMenu::render([
                                    "id" => "type_menu",
                                    "classNames" => "trtype-menu",
                                    "multiple" => true,
                                    "items" => $typeMenu,
                                ]) ?>
                            </div>

                            <div class="filter-item">
                                <h3 class="filter-item__title">Report type</h3>
                                <?= LinkMenu::render([ "id" => "report_menu", "items" => $reportMenu]) ?>
                            </div>

                            <div id="acc_block" class="filter-item"<?=hidden($byCurrency)?>>
                                <h3 class="filter-item__title">Account</h3>
                                <select id="acc_id" multiple></select>
                            </div>

                            <div id="curr_block" class="filter-item"<?=hidden(!$byCurrency)?>>
                                <h3 class="filter-item__title">Currency</h3>
                                <select id="curr_id"></select>
                            </div>

                            <div class="filter-item">
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

                            <div id="dateFilter" class="filter-item">
                                <h3 class="filter-item__title">Date range</h3>
                                <?= DateRangeInput::render($dateRange) ?>
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
