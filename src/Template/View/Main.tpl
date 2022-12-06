<?php

use JezveMoney\App\Template\Component\Tile;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap main-view">
                    <div class="widget accounts-widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?= BASEURL ?>accounts/">
                                <span>Accounts</span>
                                <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                            </a>
                        </div>
                        <div class="tiles">
                            <?php if (!count($tilesArr)) {    ?>
                                <div class="nodata-group">
                                    <span class="nodata-message">No accounts</span>
                                    <a class="btn link-btn" href="<?= BASEURL ?>accounts/create/">Create</a>
                                </div>
                                <?php    } else {
                                foreach ($tilesArr as $tile) {    ?>
                                    <?= Tile::render($tile) ?>
                            <?php       }
                            }    ?>
                        </div>
                    </div>

                    <?php if (count($tilesArr) > 0) {    ?>
                        <div class="widget total-widget">
                            <div class="widget_title">
                                <span>Total</span>
                            </div>
                            <div class="total-list">
                                <?php foreach ($totalsArr as $curr_id => $currData) {    ?>
                                    <div class="total-list__item"><?= e($currData["balfmt"]) ?></div>
                                <?php        }    ?>
                            </div>
                        </div>
                    <?php    }    ?>

                    <?php if (count($tilesArr) > 0 || count($persons) > 0) {    ?>
                        <div id="transactionsWidget" class="widget transactions-widget">
                            <div class="widget_title">
                                <a class="widget_title-link" href="<?= BASEURL ?>transactions/">
                                    <span>Transactions</span>
                                    <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                                </a>
                            </div>
                        </div>
                    <?php    }    ?>

                    <div class="widget persons-widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?= BASEURL ?>persons/">
                                <span>Persons</span>
                                <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                            </a>
                        </div>
                        <div class="tiles">
                            <?php if (!count($persons)) {        ?>
                                <div class="nodata-group">
                                    <span class="nodata-message">No persons</span>
                                    <a class="btn link-btn" href="<?= BASEURL ?>persons/create/">Create</a>
                                </div>
                            <?php    } else {    ?>
                                <?php foreach ($persons as $personTile) {    ?>
                                    <?= Tile::render($personTile) ?>
                                <?php        }    ?>
                            <?php    }    ?>
                        </div>
                    </div>

                    <?php if (count($tilesArr) > 0 || count($persons) > 0) {    ?>
                        <div class="widget statistics-widget">
                            <div class="widget_title">
                                <a class="widget_title-link" href="<?= BASEURL ?>statistics/">
                                    <span>Statistics</span>
                                    <div class="glyph"><?= svgIcon("glyph", "glyph-icon") ?></div>
                                </a>
                            </div>
                            <div id="chart" class="widget_charts">
                                <?php if (count($transactions) === 0) {    ?>
                                    <span class="nodata-message">No results</span>
                                <?php    }        ?>
                            </div>
                        </div>
                    <?php    }        ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>