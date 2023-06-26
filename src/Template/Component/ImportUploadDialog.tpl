<div id="uploadDialog" class="upload-dialog" hidden>
    <section id="fileBlock" class="upload-form__browser">
        <div class="upload-form__inner">
            <form id="fileimportfrm" class="upload-form" method="post" enctype="multipart/form-data" action="<?= BASEURL ?>api/import/upload">
                <label id="fileBrowser" class="upload-form__file">
                    <input id="fileInp" type="file">
                    <button class="btn browse-btn" type="button"><?= __("import.selectFile") ?></button>
                </label>
                <div class="upload-form__descr"><?= __("import.selectFileDescription") ?></div>
                <div class="upload-form__filename"></div>
            </form>
            <?php if ($this->adminUser || $testerUser) { ?>
                <div id="serverAddressBlock" class="input-group" hidden>
                    <input id="serverAddress" class="input input-group__input" type="text">
                    <input id="serverUploadBtn" class="btn submit-btn input-group__btn" type="button" value="<?= __("import.upload") ?>">
                </div>
            <?php   }   ?>
        </div>
        <div class="upload-form__options">
            <label id="isEncodeCheck" class="checkbox">
                <input name="encode" type="checkbox" checked>
                <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                <span class="checkbox__label"><?= __("import.cp1251Encoding") ?></span>
            </label>
            <?php if ($this->adminUser || $testerUser) { ?>
                <label id="useServerCheck" class="checkbox">
                    <input type="checkbox">
                    <span class="checkbox__check"><?= svgIcon("check", "checkbox__icon") ?></span>
                    <span class="checkbox__label"><?= __("import.useServer") ?></span>
                </label>
            <?php   }   ?>
        </div>
    </section>

    <section id="templateBlock" class="upload-form__converter" hidden>
        <div id="tplFilename" class="converter__file"></div>

        <section id="tplSelectGroup" class="converter__select-group">
            <div id="tplField" class="field template-field">
                <header id="tplFieldHeader" class="template-field__header">
                    <label><?= __("import.templates.title") ?></label>
                </header>
                <div id="tplFeedback" class="feedback" hidden></div>
            </div>
        </section>

        <section id="templateForm" class="template-form" hidden>
            <div id="firstRowField" class="field form-row first-row-field validation-block">
                <label for="firstRowInp" class="field__title"><?= __("import.templates.firstRow") ?></label>
            </div>

            <div id="tplAccountSwitchField" class="field form-row horizontal-field">
                <span class="field__title"><?= __("import.templates.setDefaultAccount") ?></span>
                <label id="tplAccountSwitch" class="switch">
                    <input type="checkbox">
                    <div class="switch-slider"></div>
                </label>
            </div>

            <div id="tplAccountField" class="field form-row tpl-account-field" hidden>
                <label class="field__title"><?= __("import.templates.defaultAccount") ?></label>
            </div>

            <div class="form-fields-row">
                <div id="columnField" class="field form-row validation-block">
                    <label for="columnSel" class="field__title"><?= __("import.templates.column") ?></label>
                    <select id="columnSel">
                        <?php foreach ($tplColumnTypes as $colType => $tplColumn) {     ?>
                            <option value="<?= e($colType) ?>"><?= e($tplColumn["title"]) ?></option>
                        <?php   }   ?>
                    </select>
                    <div id="columnFeedback" class="feedback invalid-feedback"></div>
                </div>

                <div id="dateFormatField" class="field form-row tpl-date-format-field" hidden>
                    <label class="field__title"><?= __("import.templates.dateFormat") ?></label>
                </div>
            </div>

            <div id="rawDataTable" class="field form-row raw-data-field">
                <label class="field__title"><?= __("import.templates.columnsMap") ?></label>
            </div>
            <div id="tplFormFeedback" class="feedback"></div>
        </section>
        <div id="initialAccField" class="field" hidden>
            <label class="field__title"><?= __("import.mainAccount") ?></label>
            <select id="initialAccount"></select>
        </div>
        <div id="convertFeedback" class="feedback" hidden></div>
        <div id="uploadControls" class="form-controls" hidden>
            <input id="submitUploadedBtn" class="btn submit-btn" type="button" value="<?= __("import.convertDone") ?>">
        </div>
    </section>
</div>