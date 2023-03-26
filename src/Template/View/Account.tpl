<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= e($headString) ?></h1>
                        <div class="heading-actions"></div>
                    </header>

                    <main>
                        <form id="accountForm" method="post" action="<?= e(BASEURL . "accounts/" . $this->action) ?>/">
                            <?php if ($this->action == "update") {        ?>
                                <input id="accid" name="id" type="hidden" value="<?= e($accInfo->id) ?>">
                            <?php    }    ?>

                            <div id="tileField" class="form-row"></div>

                            <div id="typeField" class="field form-row">
                                <label for="type" class="field__title"><?= __("ACCOUNT_TYPE") ?></label>
                                <select id="type" name="type"></select>
                            </div>

                            <div id="iconField" class="field form-row">
                                <label class="field__title"><?= __("ACCOUNT_ICON") ?></label>
                            </div>

                            <div id="name-inp-block" class="field validation-block form-row">
                                <label for="nameInp" class="field__title"><?= __("ACCOUNT_NAME") ?></label>
                                <input id="nameInp" class="input stretch-input" name="name" type="text" autocomplete="off" value="<?= e($accInfo->name) ?>">
                                <div id="nameFeedback" class="feedback invalid-feedback"></div>
                            </div>

                            <div id="currency-block" class="field form-row">
                                <label for="currency" class="field__title"><?= __("ACCOUNT_CURRENCY") ?></label>
                                <select id="currency" name="curr_id"></select>
                            </div>

                            <div id="initbal-inp-block" class="field validation-block form-row">
                                <label for="balanceInp" class="field__title"><?= __("ACCOUNT_INITIAL_BALANCE") ?></label>
                                <div class="input-group">
                                    <input id="balanceInp" class="input input-group__input right-align-text" name="initbalance" type="text" autocomplete="off" value="<?= e($accInfo->initbalance) ?>">
                                    <div id="currencySign" class="input-group__text"><?= e($accInfo->sign) ?></div>
                                </div>
                                <div class="feedback invalid-feedback"><?= __("ACCOUNT_INVALID_BALANCE") ?></div>
                            </div>

                            <div id="limitField" class="field validation-block form-row">
                                <label for="limitInp" class="field__title"><?= __("ACCOUNT_CREDIT_LIMIT") ?></label>
                                <div class="input-group">
                                    <input id="limitInp" class="input input-group__input right-align-text" name="limit" type="text" autocomplete="off" value="<?= e($accInfo->limit) ?>">
                                    <div id="limitCurrencySign" class="input-group__text"><?= e($accInfo->sign) ?></div>
                                </div>
                                <div class="feedback invalid-feedback"><?= __("ACCOUNT_INVALID_LIMIT") ?></div>
                            </div>

                            <div class="form-controls">
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="<?= __("SUBMIT") ?>">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= e($nextAddress) ?>"><?= __("CANCEL") ?></a>
                            </div>

                            <input id="flags" name="flags" type="hidden" value="<?= e($accInfo->flags) ?>">
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