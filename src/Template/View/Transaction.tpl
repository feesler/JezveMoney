<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= e($headString) ?></h1>
                        <div class="heading-actions"></div>
                    </header>

                    <main>
                        <form id="form" method="post" action="<?= e($form["action"]) ?>">
                            <span id="notAvailMsg" class="nodata-message" <?= hidden($trAvailable) ?>><?= e($notAvailMessage) ?></span>

                            <div id="accountsSection" class="accounts-section"></div>

                            <div id="srcAmountRow" class="field form-row validation-block" <?= hidden(!$trAvailable || !$showSrcAmount) ?>>
                                <label for="srcAmountInput" class="field__title"><?= e($srcAmountLbl) ?></label>
                                <div class="input-group">
                                    <input id="srcAmountInput" name="src_amount" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["src_amount"]) ?>">
                                    <?php if ($tr["type"] == INCOME || ($tr["type"] == DEBT && $debtType)) { ?>
                                        <button id="srcCurrBtn" class="input-group__btn" type="button" tabindex="-1">
                                            <div id="srcAmountSign" class="input-group__btn-title"><?= e($form["srcCurrSign"]) ?></div>
                                        </button>
                                    <?php   } else { ?>
                                        <button id="srcCurrBtn" class="input-group__text" type="button" tabindex="-1">
                                            <div id="srcAmountSign" class="input-group__text-title"><?= e($form["srcCurrSign"]) ?></div>
                                        </button>
                                    <?php   } ?>
                                </div>
                                <div class="feedback invalid-feedback"><?= __("TR_INVALID_AMOUNT") ?></div>
                                <input id="srcCurrInp" name="src_curr" type="hidden" value="<?= e($tr["src_curr"]) ?>">
                            </div>

                            <div id="destAmountRow" class="field form-row validation-block" <?= hidden(!$trAvailable || !$showDestAmount) ?>>
                                <label for="destAmountInput" class="field__title"><?= e($destAmountLbl) ?></label>
                                <div class="input-group">
                                    <input id="destAmountInput" name="dest_amount" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["dest_amount"]) ?>">
                                    <?php if ($tr["type"] == EXPENSE || ($tr["type"] == DEBT && !$debtType)) { ?>
                                        <button id="destCurrBtn" class="input-group__btn" type="button" tabindex="-1">
                                            <div id="destAmountSign" class="input-group__btn-title"><?= e($form["destCurrSign"]) ?></div>
                                        </button>
                                    <?php   } else { ?>
                                        <button id="destCurrBtn" class="input-group__text" type="button" tabindex="-1">
                                            <div id="destAmountSign" class="input-group__text-title"><?= e($form["destCurrSign"]) ?></div>
                                        </button>
                                    <?php   } ?>
                                </div>
                                <div class="feedback invalid-feedback"><?= __("TR_INVALID_AMOUNT") ?></div>
                                <input id="destCurrInp" name="dest_curr" type="hidden" value="<?= e($tr["dest_curr"]) ?>">
                            </div>

                            <div id="exchangeRow" class="field form-row" hidden>
                                <label for="exchangeInput" class="field__title"><?= __("TR_EXCHANGE_RATE") ?></label>
                                <div class="input-group">
                                    <input id="exchangeInput" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["exchange"]) ?>">
                                    <button id="exchangeSign" class="input-group__btn" type="button"><?= e($form["exchSign"]) ?></button>
                                </div>
                            </div>

                            <div id="srcResBalanceRow" class="field form-row" hidden>
                                <label for="srcResBalanceInput" class="field__title"><?= e($srcBalTitle) ?></label>
                                <div class="input-group">
                                    <input id="srcResBalanceInput" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["srcResult"]) ?>">
                                    <div id="srcResBalanceSign" class="input-group__text"><?= e($form["srcCurrSign"]) ?></div>
                                </div>
                            </div>

                            <div id="destResBalanceRow" class="field form-row" hidden>
                                <label for="destResBalanceInput" class="field__title"><?= e($destBalTitle) ?></label>
                                <div class="input-group">
                                    <input id="destResBalanceInput" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off" value="<?= e($form["destResult"]) ?>">
                                    <div id="destResBalanceSign" class="input-group__text"><?= e($form["destCurrSign"]) ?></div>
                                </div>
                            </div>

                            <div id="dateRow" class="field form-row validation-block" <?= hidden(!$trAvailable) ?>>
                                <label for="dateInput" class="field__title"><?= __("TR_DATE") ?></label>
                                <div class="column-container">
                                    <div class="input-group">
                                        <input id="dateInput" class="input-group__input stretch-input" name="date" type="text" autocomplete="off" value="<?= e($dateFmt) ?>">
                                        <button id="dateInputBtn" class="btn icon-btn input-group__btn" type="button">
                                            <?= useIcon("calendar-icon", "btn__icon calendar-icon") ?>
                                        </button>
                                    </div>
                                    <div id="datePickerWrapper" class="calendar"></div>
                                </div>
                                <div class="feedback invalid-feedback"><?= __("TR_INVALID_DATE") ?></div>
                            </div>

                            <div id="categoryRow" class="field form-row" <?= hidden(!$trAvailable) ?>>
                                <label for="categorySelect" class="field__title"><?= __("TR_CATEGORY") ?></label>
                                <select id="categorySelect" name="category_id"></select>
                            </div>

                            <div id="commentRow" class="field form-row" <?= hidden(!$trAvailable) ?>>
                                <label for="commentInput" class="field__title"><?= __("TR_COMMENT") ?></label>
                                <input id="commentInput" class="stretch-input" name="comment" type="text" value="<?= e($tr["comment"]) ?>">
                            </div>

                            <div id="submitControls" class="form-controls" <?= hidden(!$trAvailable) ?>>
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= e($nextAddress) ?>"><?= __("CANCEL") ?></a>
                            </div>

                            <?php if ($action == "update") {    ?>
                                <input name="id" type="hidden" value="<?= e($tr["id"]) ?>">
                            <?php    }    ?>
                            <input id="typeInp" type="hidden" value="<?= e($tr["type"]) ?>">
                            <input id="srcIdInp" type="hidden" value="<?= e($tr["src_id"]) ?>">
                            <input id="destIdInp" type="hidden" value="<?= e($tr["dest_id"]) ?>">
                            <input id="personIdInp" type="hidden" value="<?= e($person_id) ?>">
                            <input id="debtAccountInp" type="hidden" value="<?= e($acc_id) ?>">
                            <input id="debtOperationInp" type="hidden" value="<?= ($debtType ? "1" : "2") ?>">
                        </form>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ICONS_PATH . "TileIcons.tpl");    ?>
<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>