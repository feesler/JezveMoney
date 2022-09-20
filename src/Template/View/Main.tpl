<?php
use JezveMoney\App\Template\Component\Tile;

include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");		?>
        <div class="container">
            <div class="content">
                <div class="content_wrap main-view">
                    <div class="widget accounts-widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>accounts/">
                                <span>Accounts</span>
                                <div class="glyph"><?=svgIcon("glyph", "glyph-icon")?></div>
                            </a>
                        </div>
                        <div class="tiles">
<?php   if (!count($tilesArr)) {	?>
                            <span class="nodata-message">You have no one account. Please create one.</span>
<?php	} else {
            foreach($tilesArr as $tile) {    ?>
<?=Tile::render($tile)?>
<?php       }
        }	?>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget_title">
                            <span>Total</span>
                        </div>
                        <div class="total-list">
<?php	if (!count($tilesArr)) {	?>
                            <span class="nodata-message">You have no one account. Please create one.</span>
<?php	} else {	?>
<?php		foreach($totalsArr as $curr_id => $currData) {	?>
                            <div class="total-list__item"><?=e($currData["balfmt"])?></div>
<?php		}	?>
<?php	}	?>
                        </div>
                    </div>

                    <div class="widget transactions-widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>transactions/">
                                <span>Transactions</span>
                                <div class="glyph"><?=svgIcon("glyph", "glyph-icon")?></div>
                            </a>
                        </div>
                        <div class="trans-list"></div>
                    </div>

                    <div class="widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>persons/">
                                <span>Persons</span>
                                <div class="glyph"><?=svgIcon("glyph", "glyph-icon")?></div>
                            </a>
                        </div>
                        <div class="tiles">
<?php	if (!count($persons)) {		?>
                            <span class="nodata-message">No persons here.</span>
<?php	} else {	?>
<?php		foreach($persons as $personTile) {	?>
<?=Tile::render($personTile)?>
<?php		}	?>
<?php	}	?>
                        </div>
                    </div>

                    <div class="widget">
                        <div class="widget_title">
                            <a class="widget_title-link" href="<?=BASEURL?>statistics/">
                                <span>Statistics</span>
                                <div class="glyph"><?=svgIcon("glyph", "glyph-icon")?></div>
                            </a>
                        </div>
                        <div id="chart" class="widget_charts">
<?php	if (!$statArr || !is_array($statArr->values) || !count($statArr->values)) {	?>
                            <span class="nodata-message">No results found.</span>
<?php	}		?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(TPL_PATH . "Icons.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
