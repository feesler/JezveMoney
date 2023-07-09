<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= __("statistics.title") ?></h1>
                        <div class="heading-actions"></div>
                    </header>

                    <header id="contentHeader" class="content-header">
                        <aside id="filtersContainer" class="filters-container">
                            <header class="filters-heading">
                                <span class="filters-heading__title"><?= __("filters.title") ?></span>
                            </header>

                            <hr class="filters-separator">

                            <div class="filters-list">
                                <div class="filters-row">
                                    <section id="typeFilter" class="filter-item trans-type-filter">
                                        <header class="filter-item__title"><?= __("filters.transactionType") ?></header>
                                    </section>

                                    <hr class="filters-separator">

                                    <section id="reportTypeFilter" class="filter-item report-type-filter">
                                        <header class="filter-item__title"><?= __("statistics.reportType") ?></header>
                                    </section>

                                    <hr class="filters-separator">

                                    <section id="groupTypeFilter" class="filter-item group-type-filter">
                                        <header class="filter-item__title"><?= __("statistics.groupBy") ?></header>
                                    </section>
                                </div>

                                <hr class="filters-separator">

                                <div class="filters-row">
                                    <section id="accountsFilter" class="filter-item accounts-filter" <?= hidden($report !== "account") ?>>
                                        <header class="filter-item__title"><?= __("statistics.account") ?></header>
                                        <select id="acc_id" multiple></select>
                                    </section>

                                    <section id="categoriesFilter" class="filter-item category-filter" <?= hidden($report !== "category") ?>>
                                        <header class="filter-item__title"><?= __("filters.categories") ?></header>
                                        <select id="category_id" multiple></select>
                                    </section>

                                    <section id="currencyFilter" class="filter-item currency-filter" <?= hidden($report !== "currency") ?>>
                                        <header class="filter-item__title"><?= __("statistics.currency") ?></header>
                                        <select id="curr_id"></select>
                                    </section>

                                    <hr class="filters-separator">

                                    <section id="dateFilter" class="filter-item date-range-filter"></section>
                                </div>
                            </div>

                            <hr class="filters-separator">
                        </aside>
                    </header>

                    <main>
                        <div id="chart" class="stat-histogram">
                            <span class="nodata-message" hidden><?= __("statistics.noData") ?></span>
                        </div>

                        <header class="piechart-header">
                            <div id="pieChartHeaderType" class="piechart-header__type"></div>
                            <div id="pieChartHeaderDate" class="piechart-header__date"></div>
                        </header>
                        <div id="pieChartTotal" class="piechart-total">
                            <div class="piechart-total__title"><?= __("statistics.total") ?></div>
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