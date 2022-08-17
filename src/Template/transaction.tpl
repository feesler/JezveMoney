<?php
use JezveMoney\App\Template\Component\Tile;
use JezveMoney\App\Template\Component\TileInfoItem;
use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?=e($headString)?></h1>
<?php	if ($action == "update") {	?>
                        <?=IconLink::render([
                            "id" => "del_btn",
                            "icon" => "del",
                            "title" => "Delete"
                        ])?>
<?php	}	?>
                    </div>
                    <div>
                        <form id="mainfrm" method="post" action="<?=e($form["action"])?>">
<?php	if ($action == "update") {	?>
                        <input name="id" type="hidden" value="<?=e($tr["id"])?>">
<?php	}	?>
                        <input id="typeInp" name="type" type="hidden" value="<?=e($tr["type"])?>">
                        <div class="trtype-menu">
<?php	forEach($transMenu as $menuItem) {
            if ($menuItem->selected) {		?>
                            <span class="trtype-menu__item trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
                                <span class="trtype-menu_item_title"><?=e($menuItem->title)?></span>
                            </span>
<?php		} else {		?>
                            <span class="trtype-menu__item" data-type="<?=e($menuItem->type)?>">
                                <span class="trtype-menu_item_title">
                                    <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                                </span>
                            </span>
<?php		}
        }	?>
                        </div>

                        <span id="notavailmsg" class="nodata-message"<?=hidden($trAvailable)?>><?=e($noDataMessage)?></span>

                        <div class="accounts-section">
                            <div id="person" class="account-container"<?=hidden(!$trAvailable || $tr["type"] != DEBT)?>>
                                <input id="person_id" name="person_id" type="hidden" value="<?=e($person_id)?>">
                                <div class="tile_header"><label>Person</label></div>
                                <div class="tile-base">
                                    <div class="tile_container">
                                        <?=Tile::render($personTile)?>
                                    </div>

                                    <div class="tile-info-block">
<?php	if ($tr["type"] == DEBT) {		?>
                                        <?=TileInfoItem::render($srcAmountInfo)?>
                                        <?=TileInfoItem::render($exchangeInfo)?>
<?php		if ($debtType) {		?>
                                        <?=TileInfoItem::render($srcResultInfo)?>
<?php		} else {	?>
                                        <?=TileInfoItem::render($destResultInfo)?>
<?php		}	?>
<?php	}	?>
                                    </div>
                                </div>
                            </div>

<?php	if ($tr["type"] == DEBT) {		?>
                            <button id="swapBtn" class="swap-btn" type="button"<?=hidden(!$trAvailable)?>>
                                <?=svgIcon("swap", "swap-icon")?>
                            </button>
<?php	}	?>

                            <div id="debtaccount" class="account-container"<?=hidden(!$trAvailable || $tr["type"] != DEBT)?>>
                                <div class="tile_header">
                                    <label id="acclbl"><?=e($accLbl)?></label>
                                    <button id="noacc_btn" class="close-btn" type="button"<?=hidden($noAccount)?>>
                                        <?=svgIcon("close", "close-icon")?>
                                    </button>
                                </div>
                                <div class="tile-base"<?=hidden($noAccount)?>>
                                    <div class="tile_container">
                                        <?=Tile::render($debtAccountTile)?>
                                        <input id="acc_id" name="acc_id" type="hidden" value="<?=e($acc_id)?>">
                                    </div>

                                    <div class="tile-info-block">
<?php	if ($tr["type"] == DEBT) {		?>
                                        <?=TileInfoItem::render($destAmountInfo)?>
<?php		if ($debtType) { 		?>
                                        <?=TileInfoItem::render($destResultInfo)?>
<?php		} else {		?>
                                        <?=TileInfoItem::render($srcResultInfo)?>
<?php		}		?>
<?php	}		?>
                                    </div>
                                </div>
                                <div id="selaccount" class="account-toggler"<?=hidden(!$noAccount)?>>
                                    <button class="dashed-btn" type="button"><span>Select account</span></button>
                                </div>
                            </div>

                            <div id="source" class="account-container"<?=hidden(!$trAvailable || $tr["type"] == INCOME || $tr["type"] == DEBT)?>>
                                <div class="tile_header"><label>Source account</label></div>
                                <div class="tile-base">
                                    <div class="tile_container">
                                        <?=Tile::render($srcAccountTile)?>
                                    </div>

                                    <div class="tile-info-block">
<?php	if ($tr["type"] != DEBT) {		?>
<?php	    if ($tr["type"] == TRANSFER) {		?>
                                        <?=TileInfoItem::render($srcAmountInfo)?>
<?php	    }	?>
<?php	    if ($tr["type"] == EXPENSE) {		?>
                                        <?=TileInfoItem::render($destAmountInfo)?>
<?php	    }	?>
                                        <?=TileInfoItem::render($srcResultInfo)?>
<?php	    if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {		?>
                                        <?=TileInfoItem::render($exchangeInfo)?>
<?php	    }	?>
<?php	}	?>
                                    </div>
                                </div>
                            </div>
                            <input id="src_id" name="src_id" type="hidden" value="<?=e($tr["src_id"])?>">

<?php	if ($tr["type"] != DEBT) {		?>
                            <button id="swapBtn" class="swap-btn" type="button"<?=hidden(!$trAvailable || $tr["type"] == EXPENSE || $tr["type"] == INCOME)?>>
                                <?=svgIcon("swap", "swap-icon")?>
                            </button>
<?php	}	?>

                            <div id="destination" class="account-container"<?=hidden(!$trAvailable || $tr["type"] == EXPENSE || $tr["type"] == DEBT)?>>
                                <div class="tile_header"><label>Destination account</label></div>
                                <div class="tile-base">
                                    <div class="tile_container">
                                        <?=Tile::render($destAccountTile)?>
                                    </div>

                                    <div class="tile-info-block">
<?php	if ($tr["type"] != DEBT) {		?>
<?php	    if ($tr["type"] == EXPENSE || $tr["type"] == INCOME) {		?>
                                       <?=TileInfoItem::render($srcAmountInfo)?>
<?php	    }	?>
<?php	    if ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {		?>
                                       <?=TileInfoItem::render($destAmountInfo)?>
<?php	    }	?>
                                     <?=TileInfoItem::render($destResultInfo)?>

<?php	    if ($tr["type"] == INCOME) {		?>
                                       <?=TileInfoItem::render($exchangeInfo)?>
<?php	    }	?>
<?php	}	?>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <input id="dest_id" name="dest_id" type="hidden" value="<?=e($tr["dest_id"])?>">

                        <input id="debtOperation" name="op" type="hidden" value="<?=($debtType ? "1" : "2")?>">

                        <div id="src_amount_row" class="validation-block view-row std_margin"<?=hidden(!$trAvailable || !$showSrcAmount)?>>
                            <label for="src_amount"><?=e($srcAmountLbl)?></label>
                            <div class="input-group">
                                <input id="src_amount" name="src_amount" class="input-group__input stretch-input amount-input" type="text" autocomplete="off" value="<?=e($form["src_amount"])?>">
                                <button class="input-group__btn" type="button"<?=disabled($tr["type"] != INCOME)?>>
                                    <div id="srcamountsign" class="input-group__btn-title"><?=e($form["srcCurrSign"])?></div>
                                </button>
                            </div>
                            <div class="invalid-feedback">Please input correct amount.</div>
                            <input id="src_curr" name="src_curr" type="hidden" value="<?=e($tr["src_curr"])?>">
                        </div>

                        <div id="dest_amount_row" class="validation-block view-row std_margin"<?=hidden(!$trAvailable || !$showDestAmount)?>>
                            <label for="dest_amount"><?=e($destAmountLbl)?></label>
                            <div class="input-group">
                                <input id="dest_amount" name="dest_amount" class="input-group__input stretch-input amount-input" type="text" autocomplete="off" value="<?=e($form["dest_amount"])?>">
                                <button class="input-group__btn" type="button"<?=disabled($tr["type"] != EXPENSE)?>>
                                    <div id="destamountsign" class="input-group__btn-title"><?=e($form["destCurrSign"])?></div>
                                </button>
                            </div>
                            <div class="invalid-feedback">Please input correct amount.</div>
                            <input id="dest_curr" name="dest_curr" type="hidden" value="<?=e($tr["dest_curr"])?>">
                        </div>

                        <div id="exchange" class="view-row std_margin" hidden>
                            <label for="exchrate">Exchange rate</label>
                            <div class="input-group">
                                <input id="exchrate" class="input-group__input stretch-input amount-input" type="text" autocomplete="off" value="<?=e($form["exchange"])?>">
                                <div class="input-group__btn" disabled>
                                    <div id="exchcomm" class="input-group__btn-title"><?=e($form["exchSign"])?></div>
                                </div>
                            </div>
                        </div>

                        <div id="result_balance" class="view-row std_margin" hidden>
                            <label for="resbal"><?=e($srcBalTitle)?></label>
                            <div class="input-group">
                                <input id="resbal" class="input-group__input stretch-input amount-input" type="text" autocomplete="off" value="<?=e($form["srcResult"])?>">
                                <div class="input-group__btn" disabled>
                                    <div id="res_currsign" class="input-group__btn-title"><?=e($form["srcCurrSign"])?></div>
                                </div>
                            </div>
                        </div>

                        <div id="result_balance_dest" class="view-row std_margin" hidden>
                            <label for="resbal_d"><?=e($destBalTitle)?></label>
                            <div class="input-group">
                                <input id="resbal_d" class="input-group__input stretch-input amount-input" type="text" autocomplete="off" value="<?=e($form["destResult"])?>">
                                <div class="input-group__btn" disabled>
                                    <div id="res_currsign_d" class="input-group__btn-title"><?=e($form["destCurrSign"])?></div>
                                </div>
                            </div>
                        </div>

                        <div id="date_row" class="view-row std_margin"<?=hidden(!$trAvailable)?>>
                            <?=IconLink::render([
                                "id" => "calendar_btn",
                                "icon" => "cal",
                                "title" => "Change date",
                                "subtitle" => $dateFmt
                            ])?>
                            <div id="date_block" class="validation-block" hidden>
                                <label for="date">Date</label>
                                <div class="column-container">
                                    <div class="input-group">
                                        <input id="date" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?=e($dateFmt)?>">
                                        <button id="cal_rbtn" class="icon-btn input-group__btn" type="button">
                                            <?=svgIcon("cal", "icon calendar-icon")?>
                                        </button>
                                    </div>
                                    <div id="calendar" class="calendar"></div>
                                </div>
                                <div class="invalid-feedback">Please input correct date.</div>
                            </div>
                        </div>

                        <div id="comment_row" class="view-row std_margin"<?=hidden(!$trAvailable)?>>
                            <?=IconLink::render([
                                "id" => "comm_btn",
                                "icon" => "plus",
                                "title" => "Add comment",
                                "hidden" => !is_empty($tr["comment"])
                            ])?>
                            <div id="comment_block"<?=hidden(is_empty($tr["comment"]))?>>
                                <label for="comm">Comment</label>
                                <input id="comm" class="stretch-input" name="comment" type="text" value="<?=e($tr["comment"])?>">
                            </div>
                        </div>

                        <div id="submit_controls" class="acc_controls"<?=hidden(!$trAvailable)?>>
                            <input id="submitbtn" class="btn submit-btn" type="submit" value="ok">
                            <a class="btn cancel-btn" href="<?=BASEURL?>">cancel</a>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php	if ($action == "update") {	?>
<form id="delform" method="post" action="<?=BASEURL?>transactions/del/">
<input name="transactions" type="hidden" value="<?=e($tr["id"])?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
