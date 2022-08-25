<?php
use JezveMoney\App\Template\Component\IconLink;

include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body class="<?=($this->themeClass)?>">
<div class="page import-view">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
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
                                <?=IconLink::render($uploadBtn)?>

                                <div class="actions-menu">
                                    <button id="toggleActionsMenuBtn" class="actions-menu-btn" type="button">
                                        <?=svgIcon("ellipsis", "actions-menu-btn__icon")?>
                                    </button>
                                    <div id="actionsList" class="actions-menu-list" hidden>
                                        <?=IconLink::render([
                                            "id" => "newItemBtn",
                                            "classNames" => "action-iconlink",
                                            "title" => "Add item",
                                            "icon" => "plus"
                                        ])?>
                                        <?=IconLink::render([
                                            "attributes" => ["id" => "clearFormBtn", "disabled" => true],
                                            "classNames" => "action-iconlink",
                                            "title" => "Delete all",
                                            "icon" => "del"
                                        ])?>
                                        <div class="actions-menu-list__separator"></div>
                                        <label id="rulesCheck" class="checkbox action-checkbox">
                                            <input type="checkbox" checked>
                                            <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                                            <span class="checkbox__label">Enable rules</span>
                                        </label>
                                        <?=IconLink::render([
                                            "id" => "rulesBtn",
                                            "classNames" => "action-iconlink",
                                            "title" => "Edit rules",
                                            "icon" => "edit"
                                        ])?>
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

<?php	include(TPL_PATH."Component/tpl/ImportUploadDialog.tpl");	?>
<?php	include(TPL_PATH."Component/tpl/ImportRulesDialog.tpl");	?>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
</body>
</html>
