<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= __("statistics.title") ?></h1>
                        <div class="heading-actions"></div>
                    </header>

                    <header id="contentHeader" class="content-header"></header>

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