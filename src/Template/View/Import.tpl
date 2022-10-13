<?php
use JezveMoney\App\Template\Component\IconButton;

include(TPL_PATH . "Header.tpl");	?>

<div class="page import-view">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH . "Component/tpl/Header.tpl");		?>
        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Import</h1>
                    </div>

<?php   if (!$importAvailable) { ?>
                    <span id="notavailmsg" class="nodata-message"><?=e($importNotAvailableMessage)?></span>
<?php   }   ?>

                    <div class="content-header"<?=hidden(!$importAvailable)?>>
                        <div class="data-header">
                            <div class="header-field account-field">
                                <label>Main account</label>
                                <div class="header-field__content">
                                    <select id="acc_id"></select>
                                </div>
                            </div>
                            <div class="header-actions">
                                <?=IconButton::render($uploadBtn)?>

                                <div class="actions-menu">
                                    <button id="toggleActionsMenuBtn" class="btn icon-btn actions-menu-btn" type="button">
                                        <?=svgIcon("ellipsis", "actions-menu-btn__icon")?>
                                    </button>
                                    <div id="actionsList" class="actions-menu-list" hidden>
                                        <?=IconButton::render([
                                            "id" => "newItemBtn",
                                            "classNames" => "action-iconbutton",
                                            "title" => "Add item",
                                            "icon" => "plus"
                                        ])?>
                                        <?=IconButton::render([
                                            "attributes" => ["id" => "clearFormBtn", "disabled" => true],
                                            "classNames" => "action-iconbutton",
                                            "title" => "Delete all",
                                            "icon" => "del"
                                        ])?>
                                        <div class="actions-menu-list__separator"></div>
                                        <label id="rulesCheck" class="checkbox action-checkbox">
                                            <input type="checkbox" checked>
                                            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                                            <span class="checkbox__label">Enable rules</span>
                                        </label>
                                        <?=IconButton::render([
                                            "id" => "rulesBtn",
                                            "classNames" => "action-iconbutton",
                                            "title" => "Edit rules",
                                            "icon" => "edit"
                                        ])?>
                                        <div class="actions-menu-list__separator"></div>
                                        <label id="similarCheck" class="checkbox action-checkbox">
                                            <input type="checkbox" checked>
                                            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                                            <span class="checkbox__label">Check similar transactions</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="import-controls">
                            <div class="items-counter">
                                <span><span id="entrcount">0</span>&nbsp;/&nbsp;<span id="trcount">0</span> enabled</span>
                            </div>
                            <button id="submitbtn" class="btn submit-btn" type="button" disabled>Submit</button>
                        </div>
                    </div>

                    <div class="data-form"<?=hidden(!$importAvailable)?>>
                        <div id="rowsContainer" class="data-container">
                            <span class="nodata-message">No transactions to import</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php	include(TPL_PATH . "Component/tpl/ImportUploadDialog.tpl");	?>
<?php	include(TPL_PATH . "Component/tpl/ImportRulesDialog.tpl");	?>

<?php	include(ICONS_PATH . "Common.tpl");	?>
<?php	include(TPL_PATH . "Footer.tpl");	?>
