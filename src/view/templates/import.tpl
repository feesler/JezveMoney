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
                        <div id="uploadBtn" class="iconlink">
                            <button type="button">
                                <span class="iconlink__icon"><?=svgIcon("import")?></span>
                                <span class="iconlink__content"><span>Upload file</span></span>
                            </button>
                        </div>
                    </div>

                    <div class="data-form">
                        <div class="data-header">
                            <div class="header-field account-field">
                                <label>Main account</label>
                                <div class="header-field__content">
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
                                <div id="clearFormBtn" class="iconlink" disabled>
                                    <button type="button" disabled>
                                        <span class="iconlink__icon"><?=svgIcon("del")?></span>
                                        <span class="iconlink__content"><span>Delete all</span></span>
                                    </button>
                                </div>
                            </div>
                            <div class="header-field">
                                <label>Total</label>
                                <div class="header-field__content"><span id="trcount">0</span></div>
                            </div>
                            <div class="header-field">
                                <label>Enabled</label>
                                <div class="header-field__content"><span id="entrcount">0</span></div>
                            </div>
                        </div>

                        <div class="rules-container">
                            <label class="checkwrap">
                                <input id="rulesCheck" type="checkbox" checked>
                            </label>
                            <button id="rulesBtn" class="btn link-btn" type="button">Rules (<span id="rulescount"><?=count($rulesData)?></span>)</button>
                        </div>

                        <div id="rowsContainer" class="data-container">
                            <span class="nodata-message">No transactions to import</span>
                            <div class="data-container__loading hidden">Loading...</div>
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

<div id="uploadDialog" class="hidden">
    <div id="fileBlock" class="upload-form__browser">
        <div class="upload-form__header">
            <label>Select file</label>
        </div>
        <div class="upload-form__inner">
            <form id="fileimportfrm" class="upload-form" method="post" enctype="multipart/form-data" action="<?=BASEURL?>api/import/upload">
                <label id="fileBrowser" class="upload-form__file">
                    <input id="fileInp" type="file">
                    <div class="upload-form__overlap">
                        <button class="btn browse-btn" type="button">Browse</button>
                    </div>
                </label>
                <div class="upload-form__filename"></div>
            </form>
<?php	if ($this->uMod->isAdmin($this->user_id) || $this->uMod->isTester($this->user_id)) { ?>
            <div id="serverAddressBlock" class="row-container hidden">
                <input id="serverAddress" type="text">
                <input id="serverUploadBtn" class="btn submit-btn" type="button" value="Upload">
            </div>
<?php   }   ?>
            <div class="upload-form__options">
                <label class="checkwrap">
                    <input id="isEncodeCheck" name="encode" type="checkbox" checked>
                    <span>CP-1251 encoding</span>
                </label>
            </div>
        </div>
<?php	if ($this->uMod->isAdmin($this->user_id) || $this->uMod->isTester($this->user_id)) { ?>
        <label class="checkwrap std_margin">
            <input id="useServerCheck" type="checkbox">
            <span>Use address on server</span>
        </label>
<?php   }   ?>
    </div>

    <div id="templateBlock" class="tpl-form hidden">
        <div id="tplHeading" class="hidden">
            <div class="tpl-form-header">
                <label>Convert</label>
                <input id="createTplBtn" class="btn link-btn" type="button" value="Create template">
            </div>
            <label id="tplStateLbl" class="hidden">Create template</label>
            <div class="row-container std_margin">
                <div id="tplField" class="tpl-form-field">
                    <select id="templateSel">
<?php   foreach($impTemplates as $impTpl) {     ?>
                        <option value="<?=e($impTpl->id)?>"><?=e($impTpl->name)?></option>
<?php   }   ?>
                    </select>
                </div>
                <div id="nameField" class="tpl-form-field validation-block hidden">
                    <label for="tplNameInp">Name</label>
                    <input id="tplNameInp" class="tpl-name-inp" type="text">
                    <div class="invalid-feedback">Please input template name</div>
                </div>
                <input id="updateTplBtn" class="btn link-btn hidden" type="button" value="Update">
                <input id="deleteTplBtn" class="btn link-btn hidden" type="button" value="Delete">
                <div id="columnField" class="tpl-form-field validation-block hidden">
                    <label for="columnSel">Column</label>
                    <select id="columnSel">
<?php   foreach($tplColumnTypes as $colType => $tplColumn) {     ?>
                        <option value="<?=e($colType)?>"><?=e($tplColumn["title"])?></option>
<?php   }   ?>
                    </select>
                    <div id="columnFeedback" class="invalid-feedback"></div>
                </div>
            </div>
        </div>
        <div id="loadingIndicator" class="tpl-form__loading hidden">Loading...</div>
        <div id="tableDescr" class="tpl-form__title">Column map</div>
        <div id="rawDataTable" class="tpl-form__block"></div>
        <div id="tplFeedback" class="invalid-feedback hidden"></div>
        <div id="tplControls" class="import-tpl-controls std_margin hidden">
            <input id="submitTplBtn" class="btn submit-btn" type="button" value="Save">
            <input id="cancelTplBtn" class="btn link-btn cancel-btn" type="button" value="Cancel">
        </div>
    </div>
    <div id="initialAccField" class="upload-dialog-account tpl-form-field hidden">
        <label>Main account</label>
        <select id="initialAccount">
<?php foreach($accArr as $accObj) {	?>
            <option value="<?=e($accObj->id)?>"><?=e($accObj->name)?></option>
<?php }	?>
        </select>
    </div>
    <div class="upload-dialog-controls hidden">
        <input id="submitUploadedBtn" class="btn submit-btn" type="button" value="Ok">
    </div>
</div>

<div id="rulesDialog" class="rules-dialog hidden">
    <div class="rules-header">
        <label>Import rules</label>
        <input id="createRuleBtn" class="btn link-btn create-btn" type="button" value="Create">
    </div>
    <div class="rules-dialog__loading hidden">Loading...</div>
    <div class="rules-list"></div>
</div>

<?php	include(TPL_PATH."icons.tpl");	?>
<?php	include(TPL_PATH."footer.tpl");	?>
<script>
var view = new ImportView(<?=JSON::encode($viewData)?>);
</script>
</body>
</html>
