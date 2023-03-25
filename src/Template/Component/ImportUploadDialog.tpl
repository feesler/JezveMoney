<div id="uploadDialog" class="upload-dialog" hidden>
    <section id="fileBlock" class="upload-form__browser">
        <div class="upload-form__inner">
            <form id="fileimportfrm" class="upload-form" method="post" enctype="multipart/form-data" action="<?= BASEURL ?>api/import/upload">
                <label id="fileBrowser" class="upload-form__file">
                    <input id="fileInp" type="file">
                    <button class="btn browse-btn" type="button"><?= __("IMPORT_SELECT_FILE") ?></button>
                </label>
                <div class="upload-form__descr"><?= __("IMPORT_SELECT_FILE_DESCR") ?></div>
                <div class="upload-form__filename"></div>
            </form>
            <?php if ($this->adminUser || $testerUser) { ?>
                <div id="serverAddressBlock" class="input-group" hidden>
                    <input id="serverAddress" class="input input-group__input" type="text">
                    <input id="serverUploadBtn" class="btn submit-btn input-group__btn" type="button" value="<?= __("IMPORT_UPLOAD") ?>">
                </div>
            <?php   }   ?>
        </div>
        <div class="upload-form__options">
            <label id="isEncodeCheck" class="checkbox">
                <input name="encode" type="checkbox" checked>
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("IMPORT_CP1251_ENCODING") ?></span>
            </label>
            <?php if ($this->adminUser || $testerUser) { ?>
                <label id="useServerCheck" class="checkbox">
                    <input type="checkbox">
                    <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                    <span class="checkbox__label"><?= __("IMPORT_USE_SERVER") ?></span>
                </label>
            <?php   }   ?>
        </div>
    </section>

    <section id="templateBlock" class="tpl-form" hidden>
        <div id="tplFilename" class="tpl-form__file"></div>

        <section id="tplSelectGroup" class="tpl-form__select-group">
            <div id="tplField" class="field template-field">
                <header id="tplFieldHeader" class="template-field__header">
                    <label><?= __("TEMPLATE") ?></label>
                </header>
                <div id="tplFeedback" class="feedback" hidden></div>
            </div>
        </section>

        <section id="templateForm" hidden>
            <div id="nameField" class="field form-row validation-block">
                <label for="tplNameInp" class="field__title"><?= __("TEMPLATE_NAME") ?></label>
                <input id="tplNameInp" class="input stretch-input" type="text" autocomplete="off">
                <div class="feedback invalid-feedback"><?= __("TEMPLATE_INVALID_NAME") ?></div>
            </div>

            <div id="firstRowField" class="field form-row first-row-field validation-block">
                <label for="firstRowInp" class="field__title"><?= __("TEMPLATE_FIRST_ROW") ?></label>
                <div class="input-group">
                    <button id="decFirstRowBtn" class="btn input-group__btn" type="button">-</button>
                    <input id="firstRowInp" class="input input-group__input right-align-text" type="text" autocomplete="off">
                    <button id="incFirstRowBtn" class="btn input-group__btn" type="button">+</button>
                </div>
                <div class="feedback invalid-feedback"><?= __("TEMPLATE_INVALID_FIRST_ROW") ?></div>
            </div>

            <div id="tplAccountSwitchField" class="field form-row tpl-form-switch-field">
                <span class="tpl-form-field__label"><?= __("TEMPLATE_SET_DEFAULT_ACCOUNT") ?></span>
                <label id="tplAccountSwitch" class="switch">
                    <input type="checkbox">
                    <div class="switch-slider"></div>
                </label>
            </div>

            <div id="tplAccountField" class="field form-row tpl-account-field" hidden>
                <label class="field__title"><?= __("TEMPLATE_DEFAULT_ACCOUNT") ?></label>
            </div>

            <div id="columnField" class="field form-row validation-block">
                <label for="columnSel" class="field__title"><?= __("TEMPLATE_COLUMN") ?></label>
                <select id="columnSel">
                    <?php foreach ($tplColumnTypes as $colType => $tplColumn) {     ?>
                        <option value="<?= e($colType) ?>"><?= e($tplColumn["title"]) ?></option>
                    <?php   }   ?>
                </select>
                <div id="columnFeedback" class="feedback invalid-feedback"></div>
            </div>

            <div id="rawDataTable" class="field form-row raw-data-field">
                <label class="field__title"><?= __("TEMPLATE_COLUMN_MAP") ?></label>
            </div>
            <div id="tplFormFeedback" class="feedback"></div>

            <div id="tplControls" class="form-controls">
                <input id="submitTplBtn" class="btn submit-btn" type="button" value="<?= __("SAVE") ?>">
                <input id="cancelTplBtn" class="btn cancel-btn" type="button" value="<?= __("CANCEL") ?>">
            </div>
        </section>
        <div id="initialAccField" class="field" hidden>
            <label class="field__title"><?= __("IMPORT_MAIN_ACCOUNT") ?></label>
            <select id="initialAccount"></select>
        </div>
        <div id="convertFeedback" class="feedback" hidden></div>
        <div id="uploadControls" class="form-controls" hidden>
            <input id="submitUploadedBtn" class="btn submit-btn" type="button" value="<?= __("IMPORT_CONVERT_DONE") ?>">
        </div>
    </section>
</div>