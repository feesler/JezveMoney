<?php

use JezveMoney\App\Template\Component\Tile;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap main-view">
                    <section class="widget accounts-widget">
                        <header class="widget_title">
                            <a class="widget_title-link" href="<?= BASEURL ?>accounts/">
                                <span><?= __("ACCOUNTS") ?></span>
                                <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                            </a>
                        </header>
                        <div class="tiles">
                            <?php if (!count($tilesArr)) {    ?>
                                <div class="nodata-group">
                                    <span class="nodata-message"><?= __("MAIN_ACCOUNTS_NO_DATA") ?></span>
                                    <a class="btn link-btn" href="<?= BASEURL ?>accounts/create/"><?= __("CREATE") ?></a>
                                </div>
                                <?php    } else {
                                foreach ($tilesArr as $tile) {    ?>
                                    <?= Tile::render($tile) ?>
                            <?php       }
                            }    ?>
                        </div>
                    </section>

                    <?php if (count($tilesArr) > 0) {    ?>
                        <section class="widget total-widget">
                            <header class="widget_title">
                                <span><?= __("TOTAL") ?></span>
                            </header>
                            <div class="total-list">
                                <?php foreach ($totalsArr as $curr_id => $currData) {    ?>
                                    <div class="total-list__item"><?= e($currData["balfmt"]) ?></div>
                                <?php        }    ?>
                            </div>
                        </section>
                    <?php    }    ?>

                    <?php if (count($tilesArr) > 0 || count($persons) > 0) {    ?>
                        <section id="transactionsWidget" class="widget transactions-widget">
                            <header class="widget_title">
                                <a class="widget_title-link" href="<?= BASEURL ?>transactions/">
                                    <span><?= __("TRANSACTIONS") ?></span>
                                    <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                                </a>
                            </header>
                        </section>
                    <?php    }    ?>

                    <section class="widget persons-widget">
                        <header class="widget_title">
                            <a class="widget_title-link" href="<?= BASEURL ?>persons/">
                                <span><?= __("PERSONS") ?></span>
                                <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                            </a>
                        </header>
                        <div class="tiles">
                            <?php if (!count($persons)) {        ?>
                                <div class="nodata-group">
                                    <span class="nodata-message"><?= __("PERSONS_NO_DATA") ?></span>
                                    <a class="btn link-btn" href="<?= BASEURL ?>persons/create/"><?= __("CREATE") ?></a>
                                </div>
                            <?php    } else {    ?>
                                <?php foreach ($persons as $personTile) {    ?>
                                    <?= Tile::render($personTile) ?>
                                <?php        }    ?>
                            <?php    }    ?>
                        </div>
                    </section>

                    <?php if (count($tilesArr) > 0 || count($persons) > 0) {    ?>
                        <section class="widget statistics-widget">
                            <header class="widget_title">
                                <a class="widget_title-link" href="<?= BASEURL ?>statistics/">
                                    <span><?= __("STATISTICS") ?></span>
                                    <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                                </a>
                            </header>
                            <div id="chart" class="widget_charts">
                                <?php if (count($transactions) === 0) {    ?>
                                    <span class="nodata-message"><?= __("STAT_NO_DATA") ?></span>
                                <?php    }        ?>
                            </div>
                        </section>
                    <?php    }        ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>