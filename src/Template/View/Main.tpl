<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap main-view">
                    <main id="contentContainer" class="content-container">
                        <section id="summaryWidget" class="widget summary-widget">
                        </section>

                        <?php if ($accountsCount > 0) {    ?>
                            <section id="totalWidget" class="widget total-widget">
                                <header class="widget_title">
                                    <span><?= __("TOTAL") ?></span>
                                </header>
                            </section>
                        <?php    }    ?>

                        <?php if ($accountsCount > 0 || $personsCount > 0) {    ?>
                            <section id="transactionsWidget" class="widget transactions-widget">
                                <header class="widget_title">
                                    <a class="widget_title-link" href="<?= BASEURL ?>transactions/">
                                        <span><?= __("TRANSACTIONS") ?></span>
                                        <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                                    </a>
                                </header>
                            </section>
                        <?php    }    ?>

                        <?php if ($accountsCount > 0 || $personsCount > 0) {    ?>
                            <section class="widget statistics-widget">
                                <header class="widget_title">
                                    <a class="widget_title-link" href="<?= BASEURL ?>statistics/">
                                        <span><?= __("STATISTICS") ?></span>
                                        <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                                    </a>
                                </header>
                                <div id="chart" class="widget_charts">
                                    <?php if ($transactionsCount === 0) {    ?>
                                        <span class="nodata-message"><?= __("STAT_NO_DATA") ?></span>
                                    <?php    }        ?>
                                </div>
                            </section>
                        <?php    }        ?>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>