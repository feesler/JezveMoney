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
                                <label for="type" class="field__title"><?= __("accounts.type") ?></label>
                                <select id="type" name="type"></select>
                            </div>

                            <div id="iconField" class="field form-row">
                                <label class="field__title"><?= __("accounts.icon") ?></label>
                            </div>

                            <div id="currencyField" class="field form-row">
                                <label for="currency" class="field__title"><?= __("accounts.currency") ?></label>
                                <select id="currency" name="curr_id"></select>
                            </div>

                            <div class="form-controls">
                                <input id="submitBtn" class="btn submit-btn" type="submit" value="<?= __("actions.submit") ?>">
                                <a id="cancelBtn" class="btn cancel-btn" href="<?= e($nextAddress) ?>"><?= __("actions.cancel") ?></a>
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