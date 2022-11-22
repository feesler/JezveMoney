<?php

use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");    ?>

<div class="page import-view">
    <div class="page_wrapper">
        <?php require_once(TPL_PATH . "Component/tpl/Header.tpl");        ?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Import</h1>
                    </div>

                    <?php if (!$importAvailable) { ?>
                        <span id="notavailmsg" class="nodata-message"><?= e($importNotAvailableMessage) ?></span>
                    <?php   }   ?>

                    <div class="content-header" <?= hidden(!$importAvailable) ?>>
                        <div class="data-header">
                            <div class="header-field account-field">
                                <label>Main account</label>
                                <div class="header-field__content">
                                    <select id="acc_id"></select>
                                </div>
                            </div>
                            <div class="header-actions">
                                <?= IconButton::render($uploadBtn) ?>
                            </div>
                        </div>

                        <div class="import-controls">
                            <div class="counters">
                                <div class="counter">
                                    <span class="counter__title">Items</span>
                                    <span id="itemsCount" class="counter__value">0</span>
                                </div>
                                <div class="counter">
                                    <span class="counter__title">Enabled</span>
                                    <span id="enabledCount" class="counter__value">0</span>
                                </div>
                                <div id="selectedCounter" class="counter" hidden>
                                    <span class="counter__title">Selected</span>
                                    <span id="selectedCount" class="counter__value">0</span>
                                </div>
                            </div>
                            <button id="submitbtn" class="btn submit-btn" type="button" disabled>Submit</button>
                        </div>
                    </div>

                    <div class="data-form" <?= hidden(!$importAvailable) ?>>
                        <div id="rowsContainer" class="data-container">
                            <span class="nodata-message">No transactions to import</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(TPL_PATH . "Component/tpl/ImportUploadDialog.tpl");    ?>
<?php include(TPL_PATH . "Component/tpl/ImportRulesDialog.tpl");    ?>

<?php include(ICONS_PATH . "Common.tpl");    ?>
<?php include(TPL_PATH . "Footer.tpl");    ?>