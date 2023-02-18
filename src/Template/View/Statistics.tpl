<?php

use JezveMoney\App\Template\Component\DateRangeInput;
use JezveMoney\App\Template\Component\Button;
use JezveMoney\App\Template\Component\LinkMenu;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= __("STATISTICS") ?></h1>
                        <div class="heading-actions">
                            <?= Button::render([
                                "id" => "filtersBtn",
                                "classNames" => "circle-btn",
                                "type" => "button",
                                "icon" => "filter",
                            ]) ?>
                        </div>
                    </header>

                    <header id="contentHeader" class="content-header">
                        <aside id="filtersContainer" class="filters-container">
                            <header class="filters-heading">
                                <span class="filters-heading__title"><?= __("FILTERS") ?></span>
                                <button id="closeFiltersBtn" class="btn close-btn right-align" type="button">
                                    <svg class="btn__icon">
                                        <use href="#close"></use>
                                    </svg>
                                </button>
                            </header>

                            <hr class="filters-separator">

                            <div class="filters-list">
                                <div class="filters-row">
                                    <section class="filter-item trans-type-filter">
                                        <header class="filter-item__title"><?= __("FILTER_TYPE") ?></header>
                                        <?= LinkMenu::render([
                                            "id" => "typeMenu",
                                            "classNames" => "trtype-menu",
                                            "multiple" => true,
                                            "items" => $typeMenu,
                                        ]) ?>
                                    </section>

                                    <hr class="filters-separator">

                                    <section class="filter-item report-type-filter">
                                        <header class="filter-item__title"><?= __("STAT_FILTER_REPORT") ?></header>
                                        <?= LinkMenu::render(["id" => "reportMenu", "items" => $reportMenu]) ?>
                                    </section>

                                    <hr class="filters-separator">

                                    <section class="filter-item group-type-filter">
                                        <header class="filter-item__title"><?= __("STAT_GROUP_BY") ?></header>
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

                                <hr class="filters-separator">

                                <div class="filters-row">
                                    <section id="accountsFilter" class="filter-item accounts-filter" <?= hidden($report !== "account") ?>>
                                        <header class="filter-item__title"><?= __("STAT_FILTER_ACCOUNT") ?></header>
                                        <select id="acc_id" multiple></select>
                                    </section>

                                    <section id="categoriesFilter" class="filter-item category-filter" <?= hidden($report !== "category") ?>>
                                        <header class="filter-item__title"><?= __("FILTER_CATEGORIES") ?></header>
                                        <select id="category_id" multiple></select>
                                    </section>

                                    <section id="currencyFilter" class="filter-item currency-filter" <?= hidden($report !== "currency") ?>>
                                        <header class="filter-item__title"><?= __("STAT_FILTER_CURRENCY") ?></header>
                                        <select id="curr_id"></select>
                                    </section>

                                    <hr class="filters-separator">

                                    <section id="dateFilter" class="filter-item date-range-filter">
                                        <header class="filter-item__title"><?= __("FILTER_DATE_RANGE") ?></header>
                                        <?= DateRangeInput::render($dateRange) ?>
                                    </section>
                                </div>
                            </div>

                            <div class="form-controls filters-controls">
                                <button id="applyFiltersBtn" class="btn submit-btn" type="button"><?= __("APPLY") ?></button>
                            </div>
                        </aside>
                    </header>

                    <main>
                        <div id="chart" class="stat-histogram">
                            <span class="nodata-message" hidden><?= __("STAT_NO_DATA") ?></span>
                        </div>

                        <header class="piechart-header">
                            <div id="pieChartHeaderType" class="piechart-header__type"></div>
                            <div id="pieChartHeaderDate" class="piechart-header__date"></div>
                        </header>
                        <div id="pieChartTotal" class="piechart-total">
                            <div class="piechart-total__title"><?= __("STAT_TOTAL") ?></div>
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