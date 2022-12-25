<?php

use JezveMoney\App\Template\Component\DateRangeInput;
use JezveMoney\App\Template\Component\IconButton;
use JezveMoney\App\Template\Component\LinkMenu;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div id="heading" class="heading">
                        <h1>Statistics</h1>
                    </div>

                    <div id="contentHeader" class="content-header">
                        <?= IconButton::render([
                            "id" => "filtersBtn",
                            "classNames" => "filters-btn",
                            "icon" => "filter",
                            "title" => "Filters"
                        ]) ?>

                        <div id="filtersContainer" class="filters-container">
                            <div class="filters-heading">
                                <span class="filters-heading__title">Filters</span>
                                <button id="closeFiltersBtn" class="btn icon-btn close-btn right-align" type="button">
                                    <svg class="icon close-icon">
                                        <use href="#close"></use>
                                    </svg>
                                </button>
                            </div>

                            <div class="filters-list">
                                <div class="filters-row">
                                    <div class="filter-item trans-type-filter">
                                        <h3 class="filter-item__title">Type</h3>
                                        <?= LinkMenu::render([
                                            "id" => "typeMenu",
                                            "classNames" => "trtype-menu",
                                            "multiple" => true,
                                            "items" => $typeMenu,
                                        ]) ?>
                                    </div>

                                    <div class="filter-item report-type-filter">
                                        <h3 class="filter-item__title">Report type</h3>
                                        <?= LinkMenu::render(["id" => "reportMenu", "items" => $reportMenu]) ?>
                                    </div>

                                    <div class="filter-item group-type-filter">
                                        <h3 class="filter-item__title">Group by</h3>
                                        <select id="groupsel">
                                            <?php foreach ($groupTypes as $val => $grtype) {    ?>
                                                <?php if ($val == $groupType_id) {        ?>
                                                    <option value="<?= e($val) ?>" selected><?= e($grtype) ?></option>
                                                <?php        } else { ?>
                                                    <option value="<?= e($val) ?>"><?= e($grtype) ?></option>
                                                <?php        } ?>
                                            <?php    }    ?>
                                        </select>
                                    </div>
                                </div>

                                <div class="filters-row">
                                    <div id="accountsFilter" class="filter-item accounts-filter" <?= hidden($report !== "account") ?>>
                                        <h3 class="filter-item__title">Account</h3>
                                        <select id="acc_id" multiple></select>
                                    </div>

                                    <div id="categoriesFilter" class="filter-item category-filter" <?= hidden($report !== "category") ?>>
                                        <h3 class="filter-item__title">Categories</h3>
                                        <select id="category_id" multiple></select>
                                    </div>

                                    <div id="currencyFilter" class="filter-item currency-filter" <?= hidden($report !== "currency") ?>>
                                        <h3 class="filter-item__title">Currency</h3>
                                        <select id="curr_id"></select>
                                    </div>

                                    <div id="dateFilter" class="filter-item date-range-filter">
                                        <h3 class="filter-item__title">Date range</h3>
                                        <?= DateRangeInput::render($dateRange) ?>
                                    </div>
                                </div>
                            </div>

                            <div class="form-controls filters-controls">
                                <button id="applyFiltersBtn" class="btn submit-btn" type="button">Apply</button>
                            </div>
                        </div>
                    </div>

                    <div id="chart" class="stat-histogram">
                        <span class="nodata-message" hidden>No results found</span>
                    </div>

                    <div class="piechart-header">
                        <div id="pieChartHeaderType" class="piechart-header__type"></div>
                        <div id="pieChartHeaderDate" class="piechart-header__date"></div>
                    </div>
                    <div id="pieChartTotal" class="piechart-total">
                        <div class="piechart-total__title">Total</div>
                        <div id="pieChartTotalValue" class="piechart-total__value"></div>
                    </div>
                    <div id="pieChartContainer" class="piechart-container">
                        <div id="pieChartInfo" class="piechart-info">
                            <div id="pieChartInfoTitle" class="piechart-info__title"></div>
                            <div id="pieChartInfoPercent" class="piechart-info__percent"></div>
                            <div id="pieChartInfoValue" class="piechart-info__value"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>