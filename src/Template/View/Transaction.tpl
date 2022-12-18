<?php

use JezveMoney\App\Template\Component\AccountContainer;
use JezveMoney\App\Template\Component\IconButton;
use JezveMoney\App\Template\Component\LinkMenu;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1><?= e($headString) ?></h1>
                        <?php if ($action == "update") {    ?>
                            <div class="heading-actions">
                                <?= IconButton::render([
                                    "id" => "deleteBtn",
                                    "classNames" => "circle-icon",
                                    "icon" => "del",
                                    "title" => "Delete"
                                ]) ?>
                            </div>
                        <?php    }    ?>
                    </div>
                    <div>
                        <form id="form" method="post" action="<?= e($form["action"]) ?>">
                            <?php if ($action == "update") {    ?>
                                <input name="id" type="hidden" value="<?= e($tr["id"]) ?>">
                            <?php    }    ?>
                            <input id="typeInp" name="type" type="hidden" value="<?= e($tr["type"]) ?>">
                            <?= LinkMenu::render([
                                "id" => "typeMenu",
                                "classNames" => "trtype-menu",
                                "items" => $typeMenu,
                            ]) ?>

                            <span id="notAvailMsg" class="nodata-message" <?= hidden($trAvailable) ?>><?= e($notAvailMessage) ?></span>

                            <div class="accounts-section">
                                <?= AccountContainer::render($debtSrcContainer) ?>
                                <?php if ($tr["type"] == DEBT) {        ?>
                                    <button id="swapBtn" class="swap-btn" type="button" <?= hidden(!$trAvailable) ?>>
                                        <?= svgIcon("swap", "swap-icon") ?>
                                    </button>
                                <?php    }    ?>
                                <?= AccountContainer::render($debtDestContainer) ?>

                                <?= AccountContainer::render($sourceContainer) ?>
                                <?php if ($tr["type"] != DEBT) {        ?>
                                    <button id="swapBtn" class="swap-btn" type="button" <?= hidden(!$trAvailable || $tr["type"] == EXPENSE || $tr["type"] == INCOME) ?>>
                                        <?= svgIcon("swap", "swap-icon") ?>
                                    </button>
                                <?php    }    ?>
                                <?= AccountContainer::render($destContainer) ?>
                            </div>

                            <input id="debtOperationInp" name="op" type="hidden" value="<?= ($debtType ? "1" : "2") ?>">

                            <div id="srcAmountRow" class="validation-block view-row std_margin" <?= hidden(!$trAvailable || !$showSrcAmount) ?>>
                                <label for="srcAmountInput"><?= e($srcAmountLbl) ?></label>
                                <div class="input-group">
                                    <input id="srcAmountInput" name="src_amount" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["src_amount"]) ?>">
                                    <?php if ($tr["type"] == INCOME) { ?>
                                        <button id="srcCurrBtn" class="input-group__btn" type="button" tabindex="-1">
                                            <div id="srcAmountSign" class="input-group__btn-title"><?= e($form["srcCurrSign"]) ?></div>
                                        </button>
                                    <?php   } else { ?>
                                        <button id="srcCurrBtn" class="input-group__text" type="button" tabindex="-1">
                                            <div id="srcAmountSign" class="input-group__text-title"><?= e($form["srcCurrSign"]) ?></div>
                                        </button>
                                    <?php   } ?>
                                </div>
                                <div class="invalid-feedback">Input correct amount.</div>
                                <input id="srcCurrInp" name="src_curr" type="hidden" value="<?= e($tr["src_curr"]) ?>">
                            </div>

                            <div id="destAmountRow" class="validation-block view-row std_margin" <?= hidden(!$trAvailable || !$showDestAmount) ?>>
                                <label for="destAmountInput"><?= e($destAmountLbl) ?></label>
                                <div class="input-group">
                                    <input id="destAmountInput" name="dest_amount" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["dest_amount"]) ?>">
                                    <?php if ($tr["type"] == EXPENSE) { ?>
                                        <button id="destCurrBtn" class="input-group__btn" type="button" tabindex="-1">
                                            <div id="destAmountSign" class="input-group__btn-title"><?= e($form["destCurrSign"]) ?></div>
                                        </button>
                                    <?php   } else { ?>
                                        <button id="destCurrBtn" class="input-group__text" type="button" tabindex="-1">
                                            <div id="destAmountSign" class="input-group__text-title"><?= e($form["destCurrSign"]) ?></div>
                                        </button>
                                    <?php   } ?>
                                </div>
                                <div class="invalid-feedback">Input correct amount.</div>
                                <input id="destCurrInp" name="dest_curr" type="hidden" value="<?= e($tr["dest_curr"]) ?>">
                            </div>

                            <div id="exchangeRow" class="view-row std_margin" hidden>
                                <label for="exchangeInput">Exchange rate</label>
                                <div class="input-group">
                                    <input id="exchangeInput" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["exchange"]) ?>">
                                    <button id="exchangeSign" class="input-group__btn" type="button"><?= e($form["exchSign"]) ?></button>
                                </div>
                            </div>

                            <div id="srcResBalanceRow" class="view-row std_margin" hidden>
                                <label for="srcResBalanceInput"><?= e($srcBalTitle) ?></label>
                                <div class="input-group">
                                    <input id="srcResBalanceInput" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["srcResult"]) ?>">
                                    <div id="srcResBalanceSign" class="input-group__text"><?= e($form["srcCurrSign"]) ?></div>
                                </div>
                            </div>

                            <div id="destResBalanceRow" class="view-row std_margin" hidden>
                                <label for="destResBalanceInput"><?= e($destBalTitle) ?></label>
                                <div class="input-group">
                                    <input id="destResBalanceInput" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["destResult"]) ?>">
                                    <div id="destResBalanceSign" class="input-group__text"><?= e($form["destCurrSign"]) ?></div>
                                </div>
                            </div>

                            <div id="dateRow" class="validation-block view-row std_margin" <?= hidden(!$trAvailable) ?>>
                                <label for="dateInput">Date</label>
                                <div class="column-container">
                                    <div class="input-group">
                                        <input id="dateInput" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?= e($dateFmt) ?>">
                                        <button id="dateInputBtn" class="btn icon-btn input-group__btn" type="button">
                                            <?= useIcon("calendar-icon", "icon calendar-icon") ?>
                                        </button>
                                    </div>
                                    <div id="datePickerWrapper" class="calendar"></div>
                                </div>
                                <div class="invalid-feedback">Input correct date.</div>
                            </div>

                            <div id="categoryRow" class="view-row std_margin" <?= hidden(!$trAvailable) ?>>
                                <label for="categorySelect">Category</label>
                                <select id="categorySelect" name="category_id"></select>
                            </div>

                            <div id="commentRow" class="view-row std_margin" <?= hidden(!$trAvailable) ?>>
                                <label for="commentInput">Comment</label>
                                <input id="commentInput" class="stretch-input" name="comment" type="text" value="<?= e($tr["comment"]) ?>">
                            </div>

                            <div id="submitControls" class="form-controls" <?= hidden(!$trAvailable) ?>>
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="Submit">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= BASEURL ?>">Cancel</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>