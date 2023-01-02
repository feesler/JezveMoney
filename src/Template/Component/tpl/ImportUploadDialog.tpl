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
            <?php if ($this->adminUser || $this->testerUser) { ?>
                <div id="serverAddressBlock" class="input-group" hidden>
                    <input id="serverAddress" class="stretch-input input-group__input" type="text">
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
            <?php if ($this->adminUser || $this->testerUser) { ?>
                <label id="useServerCheck" class="checkbox">
                    <input type="checkbox">
                    <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                    <span class="checkbox__label"><?= __("IMPORT_USE_SERVER") ?></span>
                </label>
            <?php   }   ?>
        </div>
    </section>

    <section id="templateBlock" class="tpl-form" hidden>
        <div id="tplHeading" class="tpl-form__heading" hidden>
            <div id="tplFilename" class="tpl-form__file"></div>
            <header class="tpl-form-header">
                <label id="tplStateLbl"><?= __("TEMPLATE") ?></label>
                <input id="createTplBtn" class="btn link-btn" type="button" value="<?= __("CREATE") ?>">
            </header>
            <div id="tplSelectGroup" class="tpl-form-fields tpl-form__select-group">
                <div id="tplField" class="tpl-form-field template-field">
                    <select id="templateSel">
                        <?php foreach ($importTemplates as $template) {     ?>
                            <option value="<?= e($template->id) ?>"><?= e($template->name) ?></option>
                        <?php   }   ?>
                    </select>
                </div>
                <div class="tpl-form__select-group-controls">
                    <input id="updateTplBtn" class="btn link-btn" type="button" value="<?= __("UPDATE") ?>" hidden>
                    <input id="deleteTplBtn" class="btn link-btn" type="button" value="<?= __("DELETE") ?>" hidden>
                </div>
            </div>
            <div id="tplFormTop" class="tpl-form-fields">
                <div id="nameField" class="tpl-form-field validation-block" hidden>
                    <label for="tplNameInp"><?= __("TEMPLATE_NAME") ?></label>
                    <input id="tplNameInp" class="stretch-input tpl-name-inp" type="text" autocomplete="off">
                    <div class="invalid-feedback"><?= __("TEMPLATE_INVALID_NAME") ?></div>
                </div>
                <div id="firstRowField" class="tpl-form-field first-row-field validation-block" hidden>
                    <label for="firstRowInp"><?= __("TEMPLATE_FIRST_ROW") ?></label>
                    <div class="input-group">
                        <button id="decFirstRowBtn" class="input-group__btn" type="button">-</button>
                        <input id="firstRowInp" class="input-group__input stretch-input right-align-text" type="text" autocomplete="off">
                        <button id="incFirstRowBtn" class="input-group__btn" type="button">+</button>
                    </div>
                    <div class="invalid-feedback"><?= __("TEMPLATE_INVALID_FIRST_ROW") ?></div>
                </div>
            </div>
            <div id="tplAccountField" class="tpl-form-field tpl-account-field" hidden>
                <label id="tplAccountCheck" class="checkbox">
                    <input type="checkbox">
                    <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                    <span class="checkbox__label"><?= __("TEMPLATE_DEFAULT_ACCOUNT") ?></span>
                </label>
            </div>
            <div id="columnField" class="tpl-form-field validation-block" hidden>
                <label for="columnSel"><?= __("TEMPLATE_COLUMN") ?></label>
                <select id="columnSel">
                    <?php foreach ($tplColumnTypes as $colType => $tplColumn) {     ?>
                        <option value="<?= e($colType) ?>"><?= e($tplColumn["title"]) ?></option>
                    <?php   }   ?>
                </select>
                <div id="columnFeedback" class="invalid-feedback"></div>
            </div>
        </div>
        <div id="rawDataTable" class="tpl-form-field raw-data-field">
            <label><?= __("TEMPLATE_COLUMN_MAP") ?></label>
        </div>
        <div id="tplFeedback" class="feedback" hidden></div>
        <div id="tplControls" class="form-controls" hidden>
            <input id="submitTplBtn" class="btn submit-btn" type="button" value="<?= __("SAVE") ?>">
            <input id="cancelTplBtn" class="btn cancel-btn" type="button" value="<?= __("CANCEL") ?>">
        </div>
        <div id="initialAccField" class="tpl-form-field" hidden>
            <label><?= __("IMPORT_MAIN_ACCOUNT") ?></label>
            <select id="initialAccount"></select>
        </div>
        <div id="convertFeedback" class="feedback" hidden></div>
        <div id="uploadControls" class="form-controls" hidden>
            <input id="submitUploadedBtn" class="btn submit-btn" type="button" value="<?= __("SUBMIT") ?>">
        </div>
    </section>
</div>