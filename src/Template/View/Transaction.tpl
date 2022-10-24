<?php
use JezveMoney\App\Template\Component\AccountContainer;
use JezveMoney\App\Template\Component\IconButton;
use JezveMoney\App\Template\Component\LinkMenu;

include(TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");	?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?=e($headString)?></h1>
<?php	if ($action == "update") {	?>
                        <?=IconButton::render([
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
                        <?= LinkMenu::render([
                            "id" => "type_menu",
                            "classNames" => "trtype-menu",
                            "items" => $typeMenu,
                        ]) ?>

                        <span id="notavailmsg" class="nodata-message"<?=hidden($trAvailable)?>><?=e($notAvailMessage)?></span>

                        <div class="accounts-section">
                            <?=AccountContainer::render($debtSrcContainer)?>
<?php	if ($tr["type"] == DEBT) {		?>
                            <button id="swapBtn" class="swap-btn" type="button"<?=hidden(!$trAvailable)?>>
                                <?=svgIcon("swap", "swap-icon")?>
                            </button>
<?php	}	?>
                            <?=AccountContainer::render($debtDestContainer)?>

                            <?=AccountContainer::render($sourceContainer)?>
<?php	if ($tr["type"] != DEBT) {		?>
                            <button id="swapBtn" class="swap-btn" type="button"<?=hidden(!$trAvailable || $tr["type"] == EXPENSE || $tr["type"] == INCOME)?>>
                                <?=svgIcon("swap", "swap-icon")?>
                            </button>
<?php	}	?>
                            <?=AccountContainer::render($destContainer)?>
                        </div>

                        <input id="debtOperation" name="op" type="hidden" value="<?=($debtType ? "1" : "2")?>">

                        <div id="src_amount_row" class="validation-block view-row std_margin"<?=hidden(!$trAvailable || !$showSrcAmount)?>>
                            <label for="src_amount"><?=e($srcAmountLbl)?></label>
                            <div class="input-group">
                                <input id="src_amount" name="src_amount" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?=e($form["src_amount"])?>">
<?php   if ($tr["type"] == INCOME) { ?>
                                <button id="srcCurrBtn" class="input-group__btn" type="button" tabindex="-1">
                                    <div id="srcamountsign" class="input-group__btn-title"><?=e($form["srcCurrSign"])?></div>
                                </button>
<?php   } else { ?>
                                <button id="srcCurrBtn" class="input-group__text" type="button" disabled tabindex="-1">
                                    <div id="srcamountsign" class="input-group__text-title"><?=e($form["srcCurrSign"])?></div>
                                </button>
<?php   } ?>
                            </div>
                            <div class="invalid-feedback">Input correct amount.</div>
                            <input id="src_curr" name="src_curr" type="hidden" value="<?=e($tr["src_curr"])?>">
                        </div>

                        <div id="dest_amount_row" class="validation-block view-row std_margin"<?=hidden(!$trAvailable || !$showDestAmount)?>>
                            <label for="dest_amount"><?=e($destAmountLbl)?></label>
                            <div class="input-group">
                                <input id="dest_amount" name="dest_amount" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?=e($form["dest_amount"])?>">
<?php   if ($tr["type"] == EXPENSE) { ?>
                                <button id="destCurrBtn" class="input-group__btn" type="button" tabindex="-1">
                                    <div id="destamountsign" class="input-group__btn-title"><?=e($form["destCurrSign"])?></div>
                                </button>
<?php   } else { ?>
                                <button id="destCurrBtn" class="input-group__text" type="button" disabled tabindex="-1">
                                    <div id="destamountsign" class="input-group__text-title"><?=e($form["destCurrSign"])?></div>
                                </button>
<?php   } ?>
                            </div>
                            <div class="invalid-feedback">Input correct amount.</div>
                            <input id="dest_curr" name="dest_curr" type="hidden" value="<?=e($tr["dest_curr"])?>">
                        </div>

                        <div id="exchange" class="view-row std_margin" hidden>
                            <label for="exchrate">Exchange rate</label>
                            <div class="input-group">
                                <input id="exchrate" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?=e($form["exchange"])?>">
                                <div id="exchcomm" class="input-group__text"><?=e($form["exchSign"])?></div>
                            </div>
                        </div>

                        <div id="result_balance" class="view-row std_margin" hidden>
                            <label for="resbal"><?=e($srcBalTitle)?></label>
                            <div class="input-group">
                                <input id="resbal" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?=e($form["srcResult"])?>">
                                <div id="res_currsign" class="input-group__text"><?=e($form["srcCurrSign"])?></div>
                            </div>
                        </div>

                        <div id="result_balance_dest" class="view-row std_margin" hidden>
                            <label for="resbal_d"><?=e($destBalTitle)?></label>
                            <div class="input-group">
                                <input id="resbal_d" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?=e($form["destResult"])?>">
                                <div id="res_currsign_d" class="input-group__text"><?=e($form["destCurrSign"])?></div>
                            </div>
                        </div>

                        <div id="date_row" class="validation-block view-row std_margin"<?=hidden(!$trAvailable)?>>
                            <label for="date">Date</label>
                            <div class="column-container">
                                <div class="input-group">
                                    <input id="date" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?=e($dateFmt)?>">
                                    <button id="cal_rbtn" class="btn icon-btn input-group__btn" type="button">
                                        <?=useIcon("calendar-icon", "icon calendar-icon")?>
                                    </button>
                                </div>
                                <div id="calendar" class="calendar"></div>
                            </div>
                            <div class="invalid-feedback">Input correct date.</div>
                        </div>

                        <div id="comment_row" class="view-row std_margin"<?=hidden(!$trAvailable)?>>
                            <label for="comm">Comment</label>
                            <input id="comm" class="stretch-input" name="comment" type="text" value="<?=e($tr["comment"])?>">
                        </div>

                        <div id="submit_controls" class="form-controls"<?=hidden(!$trAvailable)?>>
                            <input id="submitBtn" class="btn submit-btn" type="submit" value="Submit">
                            <a id="cancelBtn" class="btn cancel-btn" href="<?=BASEURL?>">Cancel</a>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(ICONS_PATH . "TileIcons.tpl");	?>
<?php	include(ICONS_PATH . "Common.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
