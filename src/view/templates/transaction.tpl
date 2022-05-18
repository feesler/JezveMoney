<?php
use JezveMoney\App\Template\Tile;
use JezveMoney\App\Template\TileInfoItem;
use JezveMoney\App\Template\IconLink;

include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");	?>
        <div class="container centered">
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
                        <form id="mainfrm" method="post" action="<?=e($formAction)?>">
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

<?php	if ($action == "create" && $acc_count < 2 && $tr["type"] == TRANSFER) {	?>
                        <span class="nodata-message">You need at least two active accounts for transfer.</span>
<?php	} else if ($action == "create" && !$acc_count && $tr["type"] != TRANSFER) {		?>
                        <span class="nodata-message">You have no one active account. Please create one.</span>
<?php	} else if ($action == "create" && $tr["type"] == DEBT && !$person_id) {		?>
                        <span class="nodata-message">You have no one active person. Please create one for debts.</span>
<?php	} else {		?>
                        <div id="person" class="account-container<?=hidden($tr["type"] != DEBT)?>">
                            <input id="person_id" name="person_id" type="hidden" value="<?=e($person_id)?>">
                            <div class="tile_header"><label>Person name</label></div>
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

                        <div id="debtaccount" class="account-container<?=hidden($tr["type"] != DEBT)?>">
                            <div class="tile_header">
                                <label id="acclbl"><?=e($accLbl)?></label>
                                <button id="noacc_btn" class="close-btn<?=hidden($noAccount)?>" type="button">
                                    <?=svgIcon("close")?>
                                </button>
                            </div>
                            <div class="tile-base<?=hidden($noAccount)?>">
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
                            <div id="selaccount" class="account-toggler<?=hidden(!$noAccount)?>">
                                <button class="dashed-btn" type="button"><span>Select account</span></button>
                            </div>
                        </div>

<?php	    if ($tr["type"] == INCOME || $tr["type"] == DEBT) {	?>
                        <div id="source" class="account-container hidden">
<?php	    } else {	?>
                        <div id="source" class="account-container">
<?php	    }	?>
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

<?php	if ($tr["type"] == EXPENSE || $tr["type"] == DEBT) {	?>
                        <div id="destination" class="account-container hidden">
<?php	} else {	?>
                        <div id="destination" class="account-container">
<?php	}	?>
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
                        <input id="dest_id" name="dest_id" type="hidden" value="<?=e($tr["dest_id"])?>">

                        <div id="operation" class="view-row<?=hidden($tr["type"] != DEBT)?>">
                            <div><label>Operation</label></div>
                            <div class="debt-op-selector">
                                <label><input id="debtgive" name="op" type="radio" value="1"<?=checked($debtType)?>><span>give</span></label>
                                <label><input id="debttake" name="op" type="radio" value="2"<?=checked(!$debtType)?>><span>take</span></label>
                            </div>
                        </div>

                        <div id="src_amount_row" class="validation-block view-row<?=hidden(!$showSrcAmount)?>">
                            <div><label for="src_amount"><?=e($srcAmountLbl)?></label></div>
                            <div class="input-group std_margin">
                                <input id="src_curr" name="src_curr" type="hidden" value="<?=e($srcAmountCurr)?>">
<?php	if ($tr["type"] != INCOME) {		?>
                                <div class="stretch-input">
<?php	} else {	?>
                                <div class="stretch-input rbtn_input">
<?php	}	?>
<?php	if ($action == "update") {	?>
                                    <input id="src_amount" name="src_amount" class="amount-input" type="text" autocomplete="off" value="<?=e($tr["src_amount"])?>">
<?php	} else {	?>
                                    <input id="src_amount" name="src_amount" class="amount-input" type="text" autocomplete="off" value="">
<?php	}	?>
                                </div>
<?php	if ($tr["type"] != INCOME) {		?>
                                <div class="btn input-group__btn input-group__btn_inactive">
<?php	} else {	?>
                                <div class="btn input-group__btn">
<?php	}	?>
                                    <div id="srcamountsign" class="input-group__btn-title"><?=e($srcAmountSign)?></div>
                                </div>
                            </div>
                            <div class="invalid-feedback">Please input correct amount.</div>
                        </div>

                        <div id="dest_amount_row" class="validation-block view-row<?=hidden(!$showDestAmount)?>">
                            <div><label for="dest_amount"><?=e($destAmountLbl)?></label></div>
                            <div class="input-group std_margin">
                                <input id="dest_curr" name="dest_curr" type="hidden" value="<?=e($destAmountCurr)?>">
<?php	if ($tr["type"] == EXPENSE) {		?>
                                <div class="stretch-input rbtn_input">
<?php	} else {	?>
                                <div class="stretch-input">
<?php	}	?>
<?php	if ($action == "update") {	?>
                                    <input id="dest_amount" name="dest_amount" class="amount-input" type="text" autocomplete="off" value="<?=e($tr["dest_amount"])?>">
<?php	} else {	?>
                                    <input id="dest_amount" name="dest_amount" class="amount-input" type="text" autocomplete="off" value="">
<?php	}	?>
                                </div>
<?php	if ($tr["type"] == EXPENSE) {		?>
                                <div class="btn input-group__btn">
<?php	} else {	?>
                                <div class="btn input-group__btn input-group__btn_inactive">
<?php	}	?>
                                    <div id="destamountsign" class="input-group__btn-title"><?=e($destAmountSign)?></div>
                                </div>
                            </div>
                            <div class="invalid-feedback">Please input correct amount.</div>
                        </div>

                        <div id="exchange" class="view-row hidden">
                            <div><label for="exchrate">Exchange rate</label></div>
                            <div class="input-group std_margin">
                                <div class="stretch-input">
                                    <input id="exchrate" class="amount-input" type="text" autocomplete="off" value="<?=e($exchValue)?>">
                                </div>
                                <div class="btn input-group__btn input-group__btn_inactive">
                                    <div id="exchcomm" class="input-group__btn-title"><?=e($exchSign)?></div>
                                </div>
                            </div>
                        </div>

                        <div id="result_balance" class="view-row hidden">
                            <div><label for="resbal"><?=e($srcBalTitle)?></label></div>
                            <div class="input-group std_margin">
                                <div class="stretch-input">
                                    <input id="resbal" class="amount-input" type="text" autocomplete="off" value="<?=e($srcResBalance)?>">
                                </div>
                                <div class="btn input-group__btn input-group__btn_inactive">
                                    <div id="res_currsign" class="input-group__btn-title"><?=e($srcAmountSign)?></div>
                                </div>
                            </div>
                        </div>

                        <div id="result_balance_dest" class="view-row hidden">
                            <div><label for="resbal_d"><?=e($destBalTitle)?></label></div>
                            <div class="input-group std_margin">
                                <div class="stretch-input">
                                    <input id="resbal_d" class="amount-input" type="text" autocomplete="off" value="<?=e($destResBalance)?>">
                                </div>
                                <div class="btn input-group__btn input-group__btn_inactive">
                                    <div id="res_currsign_d" class="input-group__btn-title"><?=e($destAmountSign)?></div>
                                </div>
                            </div>
                        </div>

                        <div class="view-row">
                            <?=IconLink::render([
                                "id" => "calendar_btn",
                                "classNames" => "std_margin",
                                "icon" => "cal",
                                "title" => "Change date",
                                "subtitle" => $dateFmt
                            ])?>
                            <div id="date_block" class="validation-block hidden">
                                <div><label for="date">Date</label></div>
                                <div class="column-container std_margin">
                                    <div class="input-group">
                                        <div class="stretch-input rbtn_input">
                                            <input id="date" name="date" type="text" autocomplete="off" value="<?=e($dateFmt)?>">
                                        </div>
                                        <button id="cal_rbtn" class="btn icon-btn" type="button"><?=svgIcon("cal")?></button>
                                    </div>
                                    <div id="calendar"></div>
                                </div>
                                <div class="invalid-feedback">Please input correct date.</div>
                            </div>
                        </div>

                        <div class="view-row">
                            <?=IconLink::render([
                                "id" => "comm_btn",
                                "classNames" => "std_margin",
                                "icon" => "plus",
                                "title" => "Add comment",
                                "hidden" => !is_empty($tr["comment"])
                            ])?>
                            <div id="comment_block" class="<?=hidden(is_empty($tr["comment"]))?>">
                                <div><label for="comm">Comment</label></div>
                                <div class="std_margin">
                                    <div class="stretch-input">
                                        <input id="comm" name="comment" type="text" value="<?=e($tr["comment"])?>">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="acc_controls">
                            <input id="submitbtn" class="btn submit-btn" type="submit" value="ok">
                            <a class="btn cancel-btn" href="<?=BASEURL?>">cancel</a>
                        </div>
<?php	}	?>
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
