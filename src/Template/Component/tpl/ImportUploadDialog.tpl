<div id="uploadDialog" class="upload-dialog" hidden>
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
                <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                <span class="checkbox__label">CP-1251 encoding</span>
            </label>
<?php	if ($this->adminUser || $this->testerUser) { ?>
            <label id="useServerCheck" class="checkbox">
                <input type="checkbox">
                <span class="checkbox__check"><?=svgIcon("check", "checkbox__icon")?></span>
                <span class="checkbox__label">Use address on server</span>
            </label>
<?php   }   ?>
        </div>
    </div>

    <div id="templateBlock" class="tpl-form" hidden>
        <div id="tplHeading" hidden>
            <div id="tplFilename" class="tpl-form__file"></div>
            <div class="tpl-form-header">
                <label id="tplStateLbl">Template</label>
                <input id="createTplBtn" class="btn link-btn" type="button" value="Create template">
            </div>
            <div class="tpl-form-fields">
                <div class="tpl-form__select-group">
                    <div id="tplField" class="tpl-form-field template-field">
                        <select id="templateSel">
<?php   foreach($importTemplates as $template) {     ?>
                            <option value="<?=e($template->id)?>"><?=e($template->name)?></option>
<?php   }   ?>
                        </select>
                    </div>
                    <input id="updateTplBtn" class="btn link-btn" type="button" value="Update" hidden>
                    <input id="deleteTplBtn" class="btn link-btn" type="button" value="Delete" hidden>
                </div>
                <div id="nameField" class="tpl-form-field validation-block" hidden>
                    <label for="tplNameInp">Name</label>
                    <input id="tplNameInp" class="stretch-input tpl-name-inp" type="text" autocomplete="off">
                    <div class="invalid-feedback">Input template name</div>
                </div>
                <div id="columnField" class="tpl-form-field validation-block" hidden>
                    <label for="columnSel">Column</label>
                    <select id="columnSel">
<?php   foreach($tplColumnTypes as $colType => $tplColumn) {     ?>
                        <option value="<?=e($colType)?>"><?=e($tplColumn["title"])?></option>
<?php   }   ?>
                    </select>
                    <div id="columnFeedback" class="invalid-feedback"></div>
                </div>
                <div id="firstRowField" class="tpl-form-field first-row-field validation-block" hidden>
                    <label for="firstRowInp">First row</label>
                    <div class="input-group">
                        <button id="decFirstRowBtn" class="input-group__btn" type="button">-</button>
                        <input id="firstRowInp" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off">
                        <button id="incFirstRowBtn" class="input-group__btn" type="button">+</button>
                    </div>
                    <div class="invalid-feedback">Input row number</div>
                </div>
            </div>
        </div>
        <div id="tableDescr" class="tpl-form__title">Column map</div>
        <div id="rawDataTable"></div>
        <div id="tplFeedback" class="feedback" hidden></div>
        <div id="tplControls" class="form-controls" hidden>
            <input id="submitTplBtn" class="btn submit-btn" type="button" value="Save">
            <input id="cancelTplBtn" class="btn link-btn cancel-btn" type="button" value="Cancel">
        </div>
        <div id="initialAccField" class="tpl-form-field" hidden>
            <label>Main account</label>
            <select id="initialAccount"></select>
        </div>
        <div id="convertFeedback" class="feedback" hidden></div>
        <div id="uploadControls" class="form-controls" hidden>
            <input id="submitUploadedBtn" class="btn submit-btn" type="button" value="Submit">
        </div>
    </div>
</div>
