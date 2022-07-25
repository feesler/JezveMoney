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
                        <h1>Import transactions</h1>
                        <?=IconLink::render($uploadBtn)?>
                    </div>

<?php   if (!$importAvailable) { ?>
                    <span id="notavailmsg" class="nodata-message"><?=e($importNotAvailableMessage)?></span>
<?php   }   ?>

                    <div class="content-header"<?=hidden(!$importAvailable)?>>
                        <div class="data-header">
                            <div class="header-field account-field std_margin">
                                <label>Main account</label>
                                <div class="header-field__content">
                                    <select id="acc_id">
<?php   foreach($accounts as $account) {	?>
                                        <option value="<?=e($account->id)?>"><?=e($account->name)?></option>
<?php   }   ?>
                                    </select>
                                </div>
                            </div>
                            <div class="header-actions">
                                <?=IconLink::render([
                                    "id" => "newItemBtn",
                                    "title" => "Add item",
                                    "icon" => "plus"
                                ])?>
                                <?=IconLink::render([
                                    "attributes" => ["id" => "clearFormBtn", "disabled" => true],
                                    "title" => "Delete all",
                                    "icon" => "del"
                                ])?>
                            </div>
                            <div class="header-info">
                                <div class="header-field std_margin">
                                    <label>Total</label>
                                    <div class="header-field__content"><span id="trcount">0</span></div>
                                </div>
                                <div class="header-field std_margin">
                                    <label>Enabled</label>
                                    <div class="header-field__content"><span id="entrcount">0</span></div>
                                </div>
                            </div>
                        </div>

                        <div class="rules-container">
                            <label id="rulesCheck" class="checkbox">
                                <input type="checkbox" checked>
                                <span class="checkbox__check"><?=svgIcon("check")?></span>
                            </label>
                            <button id="rulesBtn" class="btn link-btn" type="button">Rules (<span id="rulescount"><?=count($importRules)?></span>)</button>
                        </div>
                    </div>

                    <div class="data-form"<?=hidden(!$importAvailable)?>>
                        <div id="rowsContainer" class="data-container">
                            <span class="nodata-message">No transactions to import</span>
                        </div>
                        <div class="import-controls std_margin">
                            <input id="submitbtn" class="btn submit-btn" type="button" value="ok" disabled>
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
