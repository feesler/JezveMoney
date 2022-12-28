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
                    <header id="heading" class="heading">
                        <h1>Statistics</h1>
                    </header>

                    <header id="contentHeader" class="content-header">
                        <?= IconButton::render([
                            "id" => "filtersBtn",
                            "classNames" => "filters-btn",
                            "icon" => "filter",
                            "title" => "Filters"
                        ]) ?>

                        <aside id="filtersContainer" class="filters-container">
                            <header class="filters-heading">
                                <span class="filters-heading__title">Filters</span>
                                <button id="closeFiltersBtn" class="btn icon-btn close-btn right-align" type="button">
                                    <svg class="icon close-icon">
                                        <use href="#close"></use>
                                    </svg>
                                </button>
                            </header>

                            <div class="filters-list">
                                <div class="filters-row">
                                    <section class="filter-item trans-type-filter">
                                        <header class="filter-item__title">Type</header>
                                        <?= LinkMenu::render([
                                            "id" => "typeMenu",
                                            "classNames" => "trtype-menu",
                                            "multiple" => true,
                                            "items" => $typeMenu,
                                        ]) ?>
                                    </section>

                                    <section class="filter-item report-type-filter">
                                        <header class="filter-item__title">Report type</header>
                                        <?= LinkMenu::render(["id" => "reportMenu", "items" => $reportMenu]) ?>
                                    </section>

                                    <section class="filter-item group-type-filter">
                                        <header class="filter-item__title">Group by</header>
                                        <select id="groupsel">
                                            <?php foreach ($groupTypes as $val => $grtype) {    ?>
                                                <?php if ($val == $groupType_id) {        ?>
                                                    <option value="<?= e($val) ?>" selected><?= e($grtype) ?></option>
                                                <?php        } else { ?>
                                                    <option value="<?= e($val) ?>"><?= e($grtype) ?></option>
                                                <?php        } ?>
                                            <?php    }    ?>
                                        </select>
                                    </section>
                                </div>

                                <div class="filters-row">
                                    <section id="accountsFilter" class="filter-item accounts-filter" <?= hidden($report !== "account") ?>>
                                        <header class="filter-item__title">Account</header>
                                        <select id="acc_id" multiple></select>
                                    </section>

                                    <section id="categoriesFilter" class="filter-item category-filter" <?= hidden($report !== "category") ?>>
                                        <header class="filter-item__title">Categories</header>
                                        <select id="category_id" multiple></select>
                                    </section>

                                    <section id="currencyFilter" class="filter-item currency-filter" <?= hidden($report !== "currency") ?>>
                                        <header class="filter-item__title">Currency</header>
                                        <select id="curr_id"></select>
                                    </section>

                                    <section id="dateFilter" class="filter-item date-range-filter">
                                        <header class="filter-item__title">Date range</header>
                                        <?= DateRangeInput::render($dateRange) ?>
                                    </section>
                                </div>
                            </div>

                            <div class="form-controls filters-controls">
                                <button id="applyFiltersBtn" class="btn submit-btn" type="button">Apply</button>
                            </div>
                        </aside>
                    </header>

                    <main>
                        <div id="chart" class="stat-histogram">
                            <span class="nodata-message" hidden>No results found</span>
                        </div>

                        <header class="piechart-header">
                            <div id="pieChartHeaderType" class="piechart-header__type"></div>
                            <div id="pieChartHeaderDate" class="piechart-header__date"></div>
                        </header>
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
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>