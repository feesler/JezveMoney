<?php
use JezveMoney\App\Template\Tile;
use JezveMoney\App\Template\TileInfoItem;

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
<?php	if ($action == "edit") {	?>
                        <div id="del_btn" class="iconlink">
                            <button type="button">
                                <span class="iconlink__icon"><?=svgIcon("del")?></span>
                                <span class="iconlink__content"><span>Delete</span></span>
                            </button>
                        </div>
<?php	}	?>
                    </div>
                    <div>
                        <form id="mainfrm" method="post" action="<?=e($formAction)?>">
<?php	if ($action == "edit") {	?>
                        <input name="id" type="hidden" value="<?=e($tr["id"])?>">
<?php	}	?>
                        <input name="type" type="hidden" value="<?=e($tr["type"])?>">
                        <div class="trtype-menu">
<?php	forEach($transMenu as $menuItem) {
            if ($menuItem->selected) {		?>
                            <span class="trtype-menu__item trtype-menu__item_selected" data-type="<?=e($menuItem->type)?>">
                                <span class="trtype-menu_item_title"><?=e($menuItem->title)?></span>
                            </span>
<?php		} else {		?>
                            <span class="trtype-menu__item" data-type="<?=e($menuItem->type)?>">
                                <a href="<?=e($menuItem->url)?>"><?=e($menuItem->title)?></a>
                            </span>
<?php		}
        }	?>
                        </div>

<?php	if ($action == "new" && $acc_count < 2 && $tr["type"] == TRANSFER) {	?>
                        <span class="nodata-message">You need at least two active accounts for transfer.</span>
<?php	} else if ($action == "new" && !$acc_count && $tr["type"] != TRANSFER) {		?>
                        <span class="nodata-message">You have no one active account. Please create one.</span>
<?php	} else if ($action == "new" && $tr["type"] == DEBT && !$tr["person_id"]) {		?>
                        <span class="nodata-message">You have no one active person. Please create one for debts.</span>
<?php	} else {		?>
<?php	if ($tr["type"] == DEBT) {		?>
                        <div id="person" class="account-container">
                            <input id="person_id" name="person_id" type="hidden" value="<?=e($tr["person_id"])?>">
                            <div class="tile_header"><label>Person name</label></div>
                            <div class="tile-base">
                                <div class="tile_container">
                                    <?=Tile::render($personTile)?>
                                </div>

                                <div class="tile-info-block">
                                    <?=TileInfoItem::render($srcAmountInfo)?>
                                    <?=TileInfoItem::render($exchangeInfo)?>
<?php		if ($tr["debtType"]) {		?>
                                    <?=TileInfoItem::render($srcResultInfo)?>
<?php		} else {	?>
                                    <?=TileInfoItem::render($destResultInfo)?>
<?php		}	?>
                                </div>
                            </div>
                        </div>

                        <div id="source" class="account-container">
                            <div class="tile_header">
                                <label id="acclbl"><?=e($accLbl)?></label>
<?php		if ($tr["noAccount"]) {		?>
                                <button id="noacc_btn" class="close-btn hidden" type="button"><?=svgIcon("close")?></button>
<?php		} else {	?>
                                <button id="noacc_btn" class="close-btn" type="button"><?=svgIcon("close")?></button>
<?php		}	?>
                            </div>
<?php		if ($tr["noAccount"]) {		?>
                            <div class="tile-base hidden">
<?php		} else {	?>
                            <div class="tile-base">
<?php		}	?>
                                <div class="tile_container">
                                    <?=Tile::render($debtAccountTile)?>
                                    <input id="acc_id" name="acc_id" type="hidden" value="<?=e($acc_id)?>">
                                </div>

                                <div class="tile-info-block">
                                    <?=TileInfoItem::render($destAmountInfo)?>
<?php		if ($tr["debtType"]) { 		?>
                                    <?=TileInfoItem::render($destResultInfo)?>
<?php		} else {		?>
                                    <?=TileInfoItem::render($srcResultInfo)?>
<?php		}		?>
                                </div>
                            </div>
<?php		if ($tr["noAccount"]) {		?>
                            <div id="selaccount" class="account-toggler">
<?php		} else {	?>
                            <div id="selaccount" class="account-toggler hidden">
<?php		}	?>
                                <button class="dashed-btn" type="button"><span>Select account</span></button>
                            </div>
                        </div>
<?php	}	/* if ($tr["type"] == DEBT) */	?>
<?php	if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER) {		?>
                        <div id="source" class="account-container">
                            <div class="tile_header"><label>Source account</label></div>
                            <div class="tile-base">
                                <div class="tile_container">
                                    <?=Tile::render($srcAccountTile)?>
                                    <input id="src_id" name="src_id" type="hidden" value="<?=e($tr["src_id"])?>">
                                </div>

                                <div class="tile-info-block">
<?php	if ($tr["type"] == TRANSFER) {		?>
                                    <?=TileInfoItem::render($srcAmountInfo)?>
<?php	}	?>
<?php	if ($tr["type"] == EXPENSE) {		?>
                                    <?=TileInfoItem::render($destAmountInfo)?>
<?php	}	?>
                                    <?=TileInfoItem::render($srcResultInfo)?>
                                    <?=TileInfoItem::render($exchangeInfo)?>
                                </div>
                            </div>
                        </div>
<?php	} else if ($tr["type"] == INCOME) {	?>
                        <input id="src_id" name="src_id" type="hidden" value="<?=e($tr["src_id"])?>">
<?php	}	?>

<?php	if ($tr["type"] == INCOME || $tr["type"] == TRANSFER) {		?>
                        <div id="destination" class="account-container">
                            <div class="tile_header"><label>Destination account</label></div>
                            <div class="tile-base">
                                <div class="tile_container">
                                    <?=Tile::render($destAccountTile)?>
                                    <input id="dest_id" name="dest_id" type="hidden" value="<?=e($tr["dest_id"])?>">
                                </div>

                                <div class="tile-info-block">
<?php	if ($tr["type"] == INCOME) {		?>
                                    <?=TileInfoItem::render($srcAmountInfo)?>
<?php	}	?>
                                    <?=TileInfoItem::render($destAmountInfo)?>
                                    <?=TileInfoItem::render($destResultInfo)?>

<?php	if ($tr["type"] == INCOME) {		?>
                                    <?=TileInfoItem::render($exchangeInfo)?>
<?php	}	?>
                                </div>
                            </div>
                        </div>
<?php	} else if ($tr["type"] == EXPENSE) {	?>
                        <input id="dest_id" name="dest_id" type="hidden" value="<?=e($tr["dest_id"])?>">
<?php	}	?>
<?php	if ($tr["type"] == DEBT) {		?>
                        <div id="operation" class="view-row">
                            <div><label>Operation</label></div>
                            <div class="debt-op-selector">
                                <label><input id="debtgive" name="op" type="radio" value="1"<?=($tr["debtType"] ? " checked" : "")?>><span>give</span></label>
                                <label><input id="debttake" name="op" type="radio" value="2"<?=($tr["debtType"] ? "" : " checked")?>><span>take</span></label>
                            </div>
                        </div>
<?php	}	?>
<?php	if ($showSrcAmount) {		?>
                        <div id="src_amount_row" class="validation-block view-row">
<?php	} else {	?>
                        <div id="src_amount_row" class="validation-block view-row hidden">
<?php	}	?>
                            <div><label for="src_amount"><?=e($srcAmountLbl)?></label></div>
                            <div class="input-group std_margin">
                                <input id="src_curr" name="src_curr" type="hidden" value="<?=e($srcAmountCurr)?>">
<?php	if ($tr["type"] != INCOME) {		?>
                                <div class="stretch-input">
<?php	} else {	?>
                                <div class="stretch-input rbtn_input">
<?php	}	?>
<?php	if ($action == "edit") {	?>
                                    <input id="src_amount" name="src_amount" class="amount-input" type="text" autocomplete="off" value="<?=e($tr["src_amount"])?>">
<?php	} else {	?>
                                    <input id="src_amount" name="src_amount" class="amount-input" type="text" autocomplete="off" value="">
<?php	}	?>
                                </div>
<?php	if ($tr["type"] != INCOME) {		?>
                                <div class="btn input-group__btn input-group__btn_inactive"><div id="srcamountsign"><?=e($srcAmountSign)?></div></div>
<?php	} else {	?>
                                <div class="btn input-group__btn"><div id="srcamountsign"><?=e($srcAmountSign)?></div></div>
<?php	}	?>
                            </div>
                            <div class="invalid-feedback">Please input correct amount.</div>
                        </div>

<?php	if ($showDestAmount) {		?>
                        <div id="dest_amount_row" class="validation-block view-row">
<?php	} else {	?>
                        <div id="dest_amount_row" class="validation-block view-row hidden">
<?php	}	?>
                            <div><label for="dest_amount"><?=e($destAmountLbl)?></label></div>
                            <div class="input-group std_margin">
                                <input id="dest_curr" name="dest_curr" type="hidden" value="<?=e($destAmountCurr)?>">
<?php	if ($tr["type"] == EXPENSE) {		?>
                                <div class="stretch-input rbtn_input">
<?php	} else {	?>
                                <div class="stretch-input">
<?php	}	?>
<?php	if ($action == "edit") {	?>
                                    <input id="dest_amount" name="dest_amount" class="amount-input" type="text" autocomplete="off" value="<?=e($tr["dest_amount"])?>">
<?php	} else {	?>
                                    <input id="dest_amount" name="dest_amount" class="amount-input" type="text" autocomplete="off" value="">
<?php	}	?>
                                </div>
<?php	if ($tr["type"] == EXPENSE) {		?>
                                <div class="btn input-group__btn"><div id="destamountsign"><?=e($destAmountSign)?></div></div>
<?php	} else {	?>
                                <div class="btn input-group__btn input-group__btn_inactive"><div id="destamountsign"><?=e($destAmountSign)?></div></div>
<?php	}	?>
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
                                    <div id="exchcomm"><?=e($exchSign)?></div>
                                </div>
                            </div>
                        </div>

<?php	if ($tr["type"] == EXPENSE || $tr["type"] == TRANSFER || $tr["type"] == DEBT) {		?>
                        <div id="result_balance" class="view-row hidden">
                            <div><label for="resbal"><?=e($srcBalTitle)?></label></div>
                            <div class="input-group std_margin">
                                <div class="stretch-input">
                                    <input id="resbal" class="amount-input" type="text" autocomplete="off" value="<?=e($srcResBalance)?>">
                                </div>
                                <div class="btn input-group__btn input-group__btn_inactive"><div id="res_currsign"><?=e($srcAmountSign)?></div></div>
                            </div>
                        </div>
<?php	}	?>

<?php	if ($tr["type"] == INCOME || $tr["type"] == TRANSFER || $tr["type"] == DEBT) {		?>
                        <div id="result_balance_dest" class="view-row hidden">
                            <div><label for="resbal_d"><?=e($destBalTitle)?></label></div>
                            <div class="input-group std_margin">
                                <div class="stretch-input">
                                    <input id="resbal_d" class="amount-input" type="text" autocomplete="off" value="<?=e($destResBalance)?>">
                                </div>
                                <div class="btn input-group__btn input-group__btn_inactive"><div id="res_currsign_d"><?=e($destAmountSign)?></div></div>
                            </div>
                        </div>
<?php	}	?>
                        <div class="view-row">
                            <div id="calendar_btn" class="iconlink std_margin">
                                <button type="button">
                                    <span class="iconlink__icon"><?=svgIcon("cal")?></span>
                                    <span class="iconlink__content">
                                        <span class="iconlink__title">Change date</span>
                                        <span class="iconlink__subtitle"><?=e($dateFmt)?></span>
                                    </span>
                                </button>
                            </div>
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
<?php	if (is_empty($tr["comment"])) {		?>
                            <div id="comm_btn" class="iconlink std_margin">
                                <button type="button">
                                    <span class="iconlink__icon"><?=svgIcon("plus")?></span>
                                    <span class="iconlink__content"><span>Add comment</span></span>
                                </button>
                            </div>
                            <div id="comment_block" class="hidden">
<?php	} else {	?>
                            <div id="comm_btn" class="iconlink std_margin hidden">
                                <button type="button">
                                    <span class="iconlink__icon"><?=svgIcon("plus")?></span>
                                    <span class="iconlink__content"><span>Add comment</span></span>
                                </button>
                            </div>
                            <div id="comment_block">
<?php	}	?>
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
<?php	if ($action == "edit") {	?>
<form id="delform" method="post" action="<?=BASEURL?>transactions/del/">
<input name="transactions" type="hidden" value="<?=e($tr["id"])?>">
</form>
<?php	}	?>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
