<div id="uploadDialog" hidden>
    <div id="fileBlock" class="upload-form__browser">
        <div class="upload-form__inner">
            <form id="fileimportfrm" class="upload-form" method="post" enctype="multipart/form-data" action="<?=BASEURL?>api/import/upload">
                <label id="fileBrowser" class="upload-form__file">
                    <input id="fileInp" type="file">
                    <div class="upload-form__overlap">
                        <button class="btn browse-btn" type="button">Select file</button>
                    </div>
                </label>
                <div class="upload-form__descr">or simply drop it to this dialog</div>
                <div class="upload-form__filename"></div>
            </form>
<?php	if ($this->adminUser || $this->testerUser) { ?>
            <div id="serverAddressBlock" class="row-container" hidden>
                <input id="serverAddress" class="stretch-input" type="text">
                <input id="serverUploadBtn" class="btn submit-btn" type="button" value="Upload">
            </div>
<?php   }   ?>
        </div>
        <div class="upload-form__options">
            <label id="isEncodeCheck" class="checkbox">
                <input name="encode" type="checkbox" checked>
                <span class="checkbox__check"><?=svgIcon("check")?></span>
                <span class="checkbox__label">CP-1251 encoding</span>
            </label>
<?php	if ($this->adminUser || $this->testerUser) { ?>
            <label id="useServerCheck" class="checkbox">
                <input type="checkbox">
                <span class="checkbox__check"><?=svgIcon("check")?></span>
                <span class="checkbox__label">Use address on server</span>
            </label>
<?php   }   ?>
        </div>
    </div>

    <div id="templateBlock" class="tpl-form" hidden>
        <div id="tplHeading" hidden>
            <div class="tpl-form-header">
                <label>Convert</label>
                <input id="createTplBtn" class="btn link-btn" type="button" value="Create template">
            </div>
            <label id="tplStateLbl" hidden>Create template</label>
            <div class="tpl-form-fields">
                <div id="tplField" class="tpl-form-field">
                    <select id="templateSel">
<?php   foreach($importTemplates as $template) {     ?>
                        <option value="<?=e($template->id)?>"><?=e($template->name)?></option>
<?php   }   ?>
                    </select>
                </div>
                <div id="nameField" class="tpl-form-field validation-block" hidden>
                    <label for="tplNameInp">Name</label>
                    <input id="tplNameInp" class="stretch-input tpl-name-inp" type="text">
                    <div class="invalid-feedback">Please input template name</div>
                </div>
                <input id="updateTplBtn" class="btn link-btn" type="button" value="Update" hidden>
                <input id="deleteTplBtn" class="btn link-btn" type="button" value="Delete" hidden>
                <div id="columnField" class="tpl-form-field validation-block" hidden>
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
        <div id="tableDescr" class="tpl-form__title">Column map</div>
        <div id="rawDataTable" class="tpl-form__block"></div>
        <div id="tplFeedback" class="invalid-feedback" hidden></div>
        <div id="tplControls" class="import-tpl-controls std_margin" hidden>
            <input id="submitTplBtn" class="btn submit-btn" type="button" value="Save">
            <input id="cancelTplBtn" class="btn link-btn cancel-btn" type="button" value="Cancel">
        </div>
    </div>
    <div id="initialAccField" class="upload-dialog-account tpl-form-field" hidden>
        <label>Main account</label>
        <select id="initialAccount">
<?php foreach($accounts as $account) {	?>
            <option value="<?=e($account->id)?>"><?=e($account->name)?></option>
<?php }	?>
        </select>
    </div>
    <div class="upload-dialog-controls" hidden>
        <input id="submitUploadedBtn" class="btn submit-btn" type="button" value="Ok">
    </div>
</div>
