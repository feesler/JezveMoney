<?php
    use JezveMoney\Core\JSON;
?>
<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	require_once(TPL_PATH."header.tpl");		?>
        <div class="container centered">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>Import transactions</h1>
                        <div id="uploadBtn" class="iconlink right-align">
                            <button type="button">
                                <span class="iconlink__icon"><?=svgIcon("import")?></span>
                                <span class="iconlink__content"><span>Upload file</span></span>
                            </button>
                        </div>
                    </div>

                    <div id="dataForm" class="data-form">
                        <div class="data-header">
                            <div class="header-field account-field">
                                <label>Main account</label>
                                <div>
                                    <select id="acc_id">
<?php foreach($accArr as $accObj) {	?>
                                        <option value="<?=e($accObj->id)?>"><?=e($accObj->name)?></option>
<?php }	?>
                                    </select>
                                </div>
                            </div>
                            <div class="right-align">
                                <div id="newItemBtn" class="iconlink">
                                    <button type="button">
                                        <span class="iconlink__icon"><?=svgIcon("plus")?></span>
                                        <span class="iconlink__content"><span>Add item</span></span>
                                    </button>
                                </div>
                            </div>
                            <div class="header-field">
                                <label>Total</label>
                                <div><span id="trcount">0</span></div>
                            </div>
                            <div class="header-field">
                                <label>Enabled</label>
                                <div><span id="entrcount">0</span></div>
                            </div>
                        </div>

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

<form id="fileimportfrm" class="import-form hidden" method="post" enctype="multipart/form-data" action="<?=BASEURL?>api/import/upload">
    <div class="upload-form__browser">
        <div class="import-form__title">Select file to start</div>
        <label id="fileBrowser" class="import-form__file">
            <input id="fileInp" type="file">
            <div class="import-form__overlap">
                <button class="btn browse-btn" type="button">Browse</button>
            </div>
        </label>
        <div class="import-form__filename"></div>
<?php	if ($this->uMod->isAdmin($this->user_id) || $this->uMod->isTester($this->user_id)) { ?>
        <div>
            <div class="checkwrap std_margin">
                <label>
                    <input id="useServerCheck" type="checkbox">
                    <span>Use address on server</span>
                </label>
            </div>
            <div id="serverAddressBlock" class="hidden">
                <input id="serverAddress" type="text">
            </div>
        </div>
<?php   }   ?>
    </div>
    <div id="importControls" class="import-form__controls hidden">
        <div>
            <div>
                <label>Import template</label>
            </div>
            <div class="std_margin">
                <select id="templateSel">
                    <option value="0">No template selected</option>
<?php   foreach($impTemplates as $impTpl) {     ?>
                    <option value="<?=e($impTpl->id)?>"><?=e($impTpl->name)?></option>
<?php   }   ?>
                </select>
            </div>
        </div>
        <div id="rawDataTable" class="import-tpl__block">
        </div>
        <div>
            <div>
                <label>Main account</label>
            </div>
            <div class="std_margin">
                <select id="initialAccount">
<?php foreach($accArr as $accObj) {	?>
                    <option value="<?=e($accObj->id)?>"><?=e($accObj->name)?></option>
<?php }	?>
                </select>
            </div>
        </div>
        <div>
            <div>
                <label>Options</label>
            </div>
            <div class="checkwrap std_margin">
                <label>
                    <input id="isEncodeCheck" name="encode" type="checkbox" checked>
                    <span>CP-1251 encoding</span>
                </label>
            </div>
        </div>
    </div>
</form>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
<script>
var view = new ImportView({
    accounts: <?=JSON::encode($accArr)?>,
    currencies: <?=JSON::encode($currArr)?>,
    persons: <?=JSON::encode($persArr)?>,
    rules: <?=JSON::encode($rulesData)?>
});
</script>
</body>
</html>
