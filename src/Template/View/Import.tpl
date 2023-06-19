<?php include(TPL_PATH . "Header.tpl"); ?>

<div class="page import-view">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <header id="heading" class="heading">
                        <h1><?= __("import.listTitle") ?></h1>
                        <div class="heading-actions" <?= hidden(!$importAvailable) ?>></div>
                    </header>

                    <?php if (!$importAvailable) { ?>
                        <span id="notAvailMsg" class="nodata-message"><?= e($importNotAvailableMessage) ?></span>
                    <?php   }   ?>

                    <header class="content-header" <?= hidden(!$importAvailable) ?>>
                        <div id="dataHeaderControls" class="data-header">
                            <div class="field account-field">
                                <label class="field__title"><?= __("import.mainAccount") ?></label>
                                <select id="acc_id"></select>
                            </div>
                            <button id="submitBtn" class="btn submit-btn" type="button" disabled><?= __("actions.submit") ?></button>
                        </div>

                        <div class="counters">
                            <div id="itemsCounter" class="counter">
                                <span class="counter__title"><?= __("list.itemsCounter") ?></span>
                                <span id="itemsCount" class="counter__value">0</span>
                            </div>
                            <div id="enabledCounter" class="counter">
                                <span class="counter__title"><?= __("list.enabledItemsCounter") ?></span>
                                <span id="enabledCount" class="counter__value">0</span>
                            </div>
                            <div id="selectedCounter" class="counter" hidden>
                                <span class="counter__title"><?= __("list.selectedItemsCounter") ?></span>
                                <span id="selectedCount" class="counter__value">0</span>
                            </div>
                        </div>
                    </header>

                    <main class="data-form" <?= hidden(!$importAvailable) ?>>
                        <div class="list-footer"></div>
                    </main>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(TPL_PATH . "Component/ImportUploadDialog.tpl");    ?>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>