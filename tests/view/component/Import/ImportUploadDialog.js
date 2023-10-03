import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
    input,
    wait,
    waitForFunction,
    isNum,
    evaluate,
    asyncMap,
} from 'jezve-test';
import {
    Checkbox,
    DropDown,
    Switch,
    PopupMenu,
} from 'jezvejs-test';
import { App } from '../../../Application.js';
import { WarningPopup } from '../WarningPopup.js';
import { IMPORT_DATE_LOCALE, ImportTemplate } from '../../../model/ImportTemplate.js';
import { __ } from '../../../model/locale.js';

export const BROWSE_FILE_STATE = 1;
export const LOADING_STATE = 2;
export const CONVERT_STATE = 3;
export const CREATE_TPL_STATE = 4;
export const UPDATE_TPL_STATE = 5;

const TPL_FORM_STATES = [CREATE_TPL_STATE, UPDATE_TPL_STATE];

export class ImportUploadDialog extends TestComponent {
    get tplContextMenu() {
        return this.content.tplContextMenu;
    }

    async parseContent() {
        assert(this.elem, 'Invalid import upload dialog element');

        const res = {
            closeBtn: { elem: await query(this.elem, '.close-btn') },
            // Upload form
            fileBlock: { elem: await query('#fileBlock') },
            uploadFormBrowser: { elem: await query(this.elem, '.upload-form__browser') },
            fileNameElem: { elem: await query(this.elem, '.upload-form__filename') },
            isEncodeCheck: await Checkbox.create(this, await query(this.elem, '#isEncodeCheck')),
            // Server address input
            useServerCheck: await Checkbox.create(this, await query('#useServerCheck')),
            serverAddressBlock: { elem: await query('#serverAddressBlock') },
            serverAddressInput: { elem: await query('#serverAddress') },
            serverUploadBtn: { elem: await query('#serverUploadBtn') },
            // Convert block
            templateBlock: { elem: await query('#templateBlock') },
            tplSelectGroup: { elem: await query('#tplSelectGroup') },
            templateForm: { elem: await query('#templateForm') },
            // Template select field
            tplField: { elem: await query('#tplField') },
            templateSelect: {
                elem: await query(this.elem, '.template-select'),
                titleElem: await query(this.elem, '.template-select .template-select__title'),
                menuBtn: await query(this.elem, '.template-select .menu-btn'),
            },
            templateDropDown: await DropDown.create(
                this,
                await query(this.elem, '#tplField .dd__container_attached'),
            ),
            tplFeedback: { elem: await query('#tplFeedback') },
            // Template name field
            nameField: { elem: await query('#nameField') },
            tplNameInp: { elem: await query('#tplNameInp') },
            // First row field
            firstRowField: { elem: await query('#firstRowField') },
            firstRowInp: { elem: await query('#firstRowInp') },
            decFirstRowBtn: { elem: await query('#firstRowField .input-group__inner-btn') },
            incFirstRowBtn: { elem: await query('#firstRowField .input-group__input + .input-group__inner-btn') },
            // Template account field
            tplAccountSwitch: await Switch.create(this, await query(this.elem, '#tplAccountSwitchField')),
            tplAccountField: { elem: await query('#tplAccountField') },
            tplAccountSel: await DropDown.create(this, await query('#tplAccountField .dd__container')),
            // Template column field
            columnField: { elem: await query('#columnField') },
            columnSel: await DropDown.create(this, await query('#columnField .dd__container')),
            // Template date format field
            dateFormatField: { elem: await query('#dateFormatField') },
            dateFormatSel: await DropDown.create(this, await query('#dateFormatField .dd__container')),
            // Template form
            rawDataTable: { elem: await query('#rawDataTable') },
            createTplBtn: { elem: await query('#createTplBtn') },
            submitTplBtn: { elem: await query('#templateForm .form-controls .submit-btn') },
            cancelTplBtn: { elem: await query('#templateForm .form-controls .cancel-btn') },
            tplFormFeedback: { elem: await query('#tplFormFeedback') },
            convertFeedback: { elem: await query('#convertFeedback') },
            initialAccount: await DropDown.createFromChild(this, await query('#initialAccount')),
            submitBtn: { elem: await query(this.elem, '#submitUploadedBtn') },
        };
        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of ImportUploadDialog: ${child} component not found`)
        ));

        // 'Back' utton
        res.backBtn = { elem: await query(this.elem, '.back-btn') };

        // Template select
        res.templateSelect.titleElem = await query(res.templateSelect.elem, '.template-select__title');
        // Template select context menu
        res.tplContextMenu = await PopupMenu.create(this, await query(this.elem, '.popup-menu-list'));

        res.uploadProgress = { elem: await query(this.elem, ':scope > .loading-indicator') };
        res.loadingIndicator = { elem: await query(this.elem, '.upload-form__converter > .loading-indicator') };

        res.useServerAddress = res.useServerCheck.checked;
        res.encode = res.isEncodeCheck.checked;

        [
            res.templateBlock.visible,
            res.templateForm.visible,
            res.uploadProgress.visible,
            res.loadingIndicator.visible,
        ] = await evaluate(
            (...elems) => elems.map((el) => !!el && !el.hidden),
            res.templateBlock.elem,
            res.templateForm.elem,
            res.uploadProgress.elem,
            res.loadingIndicator.elem,
        );

        const formVisible = res.templateForm.visible;

        res.isLoading = (
            res.uploadProgress.visible
            || (res.templateBlock.visible && res.loadingIndicator.visible)
        );

        res.tplFormTitle = {};
        if (res.templateBlock.visible && !res.isLoading) {
            res.tplFormTitle.elem = await query(this.elem, '.template-form-title');
        }

        [
            res.fileName,
            res.serverAddress,
            res.backBtn.visible,
            res.templateSelect.title,
            res.tplNameInp.value,
            res.firstRowInp.value,
            res.decFirstRowBtn.disabled,
            res.incFirstRowBtn.disabled,
            res.tplFeedback.title,
            res.tplFeedback.isValid,
            res.tplFormFeedback.title,
            res.tplFormFeedback.isValid,
            res.tplFormTitle.title,
            res.convertFeedback.title,
            res.convertFeedback.visible,
            res.cancelTplBtn.disabled,
        ] = await evaluate(
            (
                fileEl,
                serverEl,
                backBtn,
                tplEl,
                nameEl,
                inpEl,
                decBtn,
                incBtn,
                fbEl,
                formFbEl,
                titleEl,
                convFbEL,
                cancelBtn,
            ) => ([
                fileEl.value,
                serverEl.value,
                !!backBtn && !backBtn.hidden,
                tplEl.textContent,
                nameEl.value,
                inpEl.value,
                decBtn.disabled,
                incBtn.disabled,
                fbEl.textContent,
                fbEl.classList.contains('valid-feedback'),
                formFbEl.textContent,
                formFbEl.classList.contains('valid-feedback'),
                titleEl?.textContent,
                convFbEL?.textContent,
                !!convFbEL && !convFbEL.hidden,
                cancelBtn?.disabled,
            ]),
            res.fileNameElem.elem,
            res.serverAddressInput.elem,
            res.backBtn.elem,
            res.templateSelect.titleElem,
            res.tplNameInp.elem,
            res.firstRowInp.elem,
            res.decFirstRowBtn.elem,
            res.incFirstRowBtn.elem,
            res.tplFeedback.elem,
            res.tplFormFeedback.elem,
            res.tplFormTitle.elem,
            res.convertFeedback.elem,
            res.cancelTplBtn.elem,
        );

        res.uploadFilename = (res.useServerAddress) ? res.serverAddress : res.fileName;
        res.isTplLoading = res.templateDropDown.disabled;

        res.columns = null;
        if (formVisible && !res.isLoading) {
            res.columns = await asyncMap(
                await queryAll(res.rawDataTable.elem, '.raw-data-table__data .raw-data-column'),
                async (elem) => this.parseRawDataTableColumn(elem),
            );

            if (!res.columns.length) {
                res.columns = null;
            }

            const rowNumbersColumn = await query(res.rawDataTable.elem, '.raw-data-column_row-numbers');
            res.rowNumbers = await this.parseRawDataTableColumn(rowNumbersColumn);
        }

        if (res.isLoading) {
            res.state = LOADING_STATE;
        } else if (res.templateBlock.visible) {
            const createTplTitle = __('import.templates.create');
            const updateTplTitle = __('import.templates.update');

            if (formVisible && res.tplFormTitle.title === createTplTitle) {
                res.state = CREATE_TPL_STATE;
            } else if (formVisible && res.tplFormTitle.title === updateTplTitle) {
                res.state = UPDATE_TPL_STATE;
            } else {
                res.state = CONVERT_STATE;
            }
        } else {
            res.state = BROWSE_FILE_STATE;
        }

        res.delete_warning = await WarningPopup.create(this, await query('#tpl_delete_warning'));

        return res;
    }

    async parseRawDataTableColumn(elem) {
        if (!elem) {
            return null;
        }

        const res = await evaluate((el) => {
            const tplPropsElems = Array.from(
                el.querySelectorAll('.raw-data-column__tpl .raw-data-column__tpl-prop'),
            );
            const headerEl = el.querySelector('.raw-data-column__header');
            const cellElems = Array.from(el.querySelectorAll('.raw-data-column__cell'));

            const column = {
                tplProperties: tplPropsElems.map((item) => item.textContent),
                cells: cellElems.map((item) => item.textContent),
            };

            if (headerEl) {
                column.title = headerEl.textContent;
            }

            return column;
        }, elem);
        res.elem = elem;

        return res;
    }

    buildModel(cont) {
        const res = {};

        res.state = cont.state;
        res.uploadInProgress = cont.uploadProgress.visible;
        res.isTplLoading = cont.isTplLoading;
        res.isValid = cont.tplFeedback.isValid;
        res.isFormValid = cont.tplFormFeedback.isValid;
        res.convertFeedbackVisible = cont.convertFeedback.visible;

        res.useServerAddress = cont.useServerAddress;
        res.filename = cont.uploadFilename;
        res.fileData = cont.fileData;

        res.templateMenuVisible = res.tplContextMenu?.visible ?? false;

        res.selectedTemplateId = cont.templateDropDown?.value ?? 0;

        res.template = (cont.state === CREATE_TPL_STATE)
            ? new ImportTemplate({})
            : App.state.templates.getItem(res.selectedTemplateId);

        if (
            (cont.state === CREATE_TPL_STATE || cont.state === UPDATE_TPL_STATE)
            && res.template
        ) {
            res.selectedColumn = cont.columnSel.value;

            res.template.name = cont.tplNameInp.value;
            res.template.first_row = parseInt(cont.firstRowInp.value, 10);
            res.template.account_id = (cont.tplAccountSwitch.checked)
                ? parseInt(cont.tplAccountSel.value, 10)
                : 0;

            res.template.date_locale = cont.dateFormatSel.value;

            res.template.columns = {};
            if (Array.isArray(cont.columns)) {
                const propTitleMap = {
                    accountAmount: __('import.templates.columns.accountAmount'),
                    transactionAmount: __('import.templates.columns.transactionAmount'),
                    accountCurrency: __('import.templates.columns.accountCurrency'),
                    transactionCurrency: __('import.templates.columns.transactionCurrency'),
                    date: __('import.templates.columns.date'),
                    comment: __('import.templates.columns.comment'),
                };

                cont.columns.forEach((column, ind) => {
                    for (const propName in propTitleMap) {
                        if (!Object.prototype.hasOwnProperty.call(propTitleMap, propName)) {
                            continue;
                        }

                        const propTitle = propTitleMap[propName];

                        if (column.tplProperties.includes(propTitle)) {
                            res.template.columns[propName] = ind + 1;
                        }
                    }
                });
            }
        }

        res.rawData = null;
        if (Array.isArray(cont.columns)) {
            res.rawData = cont.columns.map((column) => ({
                tplProperties: column.tplProperties,
                title: column.title,
                cells: column.cells,
            }));
        }

        res.initialAccount = App.state.accounts.getItem(cont.initialAccount.value);
        assert(res.initialAccount, 'Initial account not found');

        return res;
    }

    assertStateId(state) {
        assert(this.model.state === state, `Invalid state of upload dialog: ${this.model.state}. ${state} is expected`);
    }

    checkBrowseFileState() {
        this.assertStateId(BROWSE_FILE_STATE);
    }

    checkRawDataState() {
        this.assertStateId(CONVERT_STATE);
    }

    isTemplateFormState(model = this.model) {
        return TPL_FORM_STATES.includes(model.state);
    }

    checkTplFormState(model = this.model) {
        assert(this.isTemplateFormState(model), `Invalid state: ${model.state}`);
    }

    getColumn(data, index, firstRowInd = 1) {
        const rowsToShow = 2;
        const headerRow = data.slice(0, 1)[0];
        const ind = parseInt(index, 10);
        assert.arrayIndex(headerRow, ind);

        const res = {
            title: headerRow[ind],
        };

        const cellsData = data.slice(firstRowInd, firstRowInd + rowsToShow);
        res.cells = cellsData.map((row) => {
            const val = row[ind];
            if (isNum(val)) {
                return parseFloat(val).toString();
            }

            return val;
        });

        return res;
    }

    getExpectedState(model = this.model) {
        const isBrowseState = model.state === BROWSE_FILE_STATE;
        const isLoadingState = model.state === LOADING_STATE;
        const isConvertState = model.state === CONVERT_STATE;
        const isFormState = this.isTemplateFormState(model);
        const isDateFormatColumn = model.selectedColumn === 'date';

        const res = {
            backBtn: { visible: isConvertState || isFormState },
            uploadFormBrowser: { visible: isBrowseState },
            isEncodeCheck: { visible: isBrowseState },
            serverAddressBlock: { visible: isBrowseState && model.useServerAddress },
            columns: null,
            initialAccount: { value: model.initialAccount.id.toString() },
        };

        res.templateBlock = { visible: !isBrowseState };
        // Select template block
        res.tplSelectGroup = { visible: isConvertState };
        res.tplField = { visible: isConvertState };
        res.tplFeedback = { visible: isConvertState };

        if (model.templateMenuVisible) {
            res.tplContextMenu = {
                visible: true,
                ctxUpdateTemplateBtn: { visible: true },
                ctxDeleteTemplateBtn: { visible: true },
            };
        }

        // Template form
        res.templateForm = { visible: isFormState };
        res.rawDataTable = { visible: isFormState };
        res.nameField = { visible: isFormState };
        res.firstRowField = { visible: isFormState };
        res.columnField = { visible: isFormState };
        res.dateFormatField = { visible: isFormState && isDateFormatColumn };
        res.tplFormFeedback = { visible: isFormState };
        res.convertFeedback = { visible: model.convertFeedbackVisible };
        res.submitTplBtn = { visible: isFormState };

        const showCancelBtn = (model.state === CREATE_TPL_STATE)
            ? (App.state.templates.length > 0)
            : isFormState;
        res.cancelTplBtn = { visible: showCancelBtn };

        if (!isLoadingState) {
            res.fileBlock = { visible: isBrowseState };
        }

        res.loadingIndicator = { visible: isLoadingState };

        if (isFormState) {
            assert(model.template, 'Invalid model: expected template');

            res.tplNameInp = { value: model.template.name };

            const firstRow = (!Number.isNaN(model.template.first_row))
                ? model.template.first_row
                : '';
            res.firstRowInp = { value: firstRow.toString() };

            res.decFirstRowBtn = {
                visible: true,
                disabled: (firstRow === '' || firstRow <= 1),
            };
            res.incFirstRowBtn = {
                visible: true,
                disabled: false,
            };

            const useAccount = !!model.template.account_id;
            res.tplAccountSwitch = {
                visible: true,
                checked: useAccount,
            };
            res.tplAccountSel = {
                visible: useAccount,
            };
            if (useAccount) {
                res.tplAccountSel.value = model.template.account_id.toString();
            }

            res.dateFormatSel = {
                visible: isDateFormatColumn,
                value: model.template.date_locale,
            };
        }

        if (isBrowseState) {
            res.uploadFilename = model.filename;
        }

        res.submitBtn = { visible: isConvertState && model.isValid };

        if ([CREATE_TPL_STATE, UPDATE_TPL_STATE].includes(model.state)) {
            const firstRowInd = (Number.isNaN(model.template.first_row))
                ? 1
                : model.template.first_row;
            const firstRowIndex = Math.max(firstRowInd, 2);

            const [rawDataHeader] = this.parent.fileData.slice(0, 1);
            res.columns = rawDataHeader.map(
                (_, ind) => this.getColumn(this.parent.fileData, ind, firstRowIndex - 1),
            );
            res.rowNumbers = {
                cells: ['1'],
            };

            for (let i = 0; i < 3; i += 1) {
                const rowNumber = firstRowIndex + i;
                res.rowNumbers.cells.push(rowNumber.toString());
            }
        }

        return res;
    }

    isValidTemplate(template = this.model.template, state = App.state) {
        return state.templates.isValidTemplate(template, this.parent.fileData);
    }

    async close() {
        await click(this.content.closeBtn.elem);
    }

    async toggleServerAddress() {
        this.checkBrowseFileState();

        await this.performAction(() => this.content.useServerCheck.toggle());
    }

    async setFile(filename) {
        this.checkBrowseFileState();
        assert.isString(filename, 'Invalid parameter');

        if (!this.content.useServerAddress) {
            await this.toggleServerAddress();
        }

        this.model.filename = filename;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => input(this.content.serverAddressInput.elem, filename));

        return this.checkState();
    }

    async upload() {
        this.checkBrowseFileState();
        assert(this.model.filename?.length, 'File name not set');

        if (App.state.templates.length > 0) {
            this.model.state = CONVERT_STATE;

            const template = App.state.templates.findValidTemplate(this.parent.fileData);
            if (template) {
                this.model.template = template;
                if (template.account_id) {
                    this.model.initialAccount = App.state.accounts.getItem(template.account_id);
                }
            }
            this.model.isValid = !!template;
        } else {
            this.model.state = CREATE_TPL_STATE;
            this.model.selectedColumn = 'accountAmount';
            this.model.template = new ImportTemplate({
                name: '',
                account_id: 0,
                first_row: 2,
                date_locale: IMPORT_DATE_LOCALE,
                columns: {},
            });
        }
        this.expectedState = this.getExpectedState();

        await this.performAction(async () => {
            await click(this.content.serverUploadBtn.elem);

            await wait('#templateBlock', { visible: true });
            await wait('.upload-form__converter > .loading-indicator', { hidden: true });
        });

        return this.checkState();
    }

    async selectTemplateById(val) {
        this.checkRawDataState();

        const template = App.state.templates.getItem(val);
        this.model.template = template;
        if (template?.account_id) {
            this.model.initialAccount = App.state.accounts.getItem(template.account_id);
        }
        this.model.isValid = this.isValidTemplate();
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.templateDropDown.selectItem(val));

        return this.checkState();
    }

    async selectTemplateByIndex(val) {
        const itemId = App.state.templates.indexToId(val);
        return this.selectTemplateById(itemId);
    }

    async createTemplate() {
        this.checkRawDataState();

        this.model.state = CREATE_TPL_STATE;
        this.model.convertFeedbackVisible = false;
        this.model.selectedColumn = 'accountAmount';
        this.model.template = new ImportTemplate({
            name: '',
            first_row: 2,
            date_locale: IMPORT_DATE_LOCALE,
            columns: {},
        });
        this.expectedState = this.getExpectedState();

        await this.performAction(() => click(this.content.createTplBtn.elem));

        return this.checkState();
    }

    async openTemplateMenu() {
        if (this.model.templateMenuVisible) {
            return;
        }

        await this.performAction(() => click(this.content.templateSelect.menuBtn));
    }

    async updateTemplate() {
        this.checkRawDataState();

        this.model.state = UPDATE_TPL_STATE;
        this.model.convertFeedbackVisible = false;
        this.model.selectedColumn = 'accountAmount';
        this.model.template = App.state.templates.getItem(this.content.templateDropDown.value);
        this.expectedState = this.getExpectedState();

        await this.openTemplateMenu();
        await this.performAction(() => this.tplContextMenu.select('ctxUpdateTemplateBtn'));

        return this.checkState();
    }

    async deleteTemplate() {
        this.checkRawDataState();

        if (this.content.templateDropDown.items.length === 1) {
            this.model.state = CREATE_TPL_STATE;
            this.model.selectedColumn = 'accountAmount';
            this.model.template = new ImportTemplate({
                name: '',
                first_row: 2,
                date_locale: IMPORT_DATE_LOCALE,
                columns: {},
            });
        } else {
            this.model.state = CONVERT_STATE;
            const currentInd = this.content.templateDropDown.items.findIndex(
                (item) => item.id === this.content.templateDropDown.value,
            );
            const newInd = (currentInd > 0) ? 0 : 1;
            const newTplId = this.content.templateDropDown.items[newInd].id;
            const template = App.state.templates.getItem(newTplId);
            this.model.template = template;
            if (template?.account_id) {
                this.model.initialAccount = App.state.accounts.getItem(template.account_id);
            }
        }

        this.expectedState = this.getExpectedState();

        await this.openTemplateMenu();
        await this.performAction(() => this.tplContextMenu.select('ctxDeleteTemplateBtn'));

        assert(this.content.delete_warning?.content?.visible, 'Delete template warning popup not appear');

        await click(this.content.delete_warning.content.okBtn);
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.isTplLoading;
        });

        return this.checkState();
    }

    async inputTemplateName(val) {
        this.checkTplFormState();

        this.model.template.name = val;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => input(this.content.tplNameInp.elem, val));

        return this.checkState();
    }

    async selectTemplateColumn(name, index) {
        this.checkTplFormState();

        this.model.template.columns[name] = index;
        const invalidColumn = this.model.template.getFirstInvalidColumn(this.parent.fileData);
        if (invalidColumn !== null) {
            this.model.selectedColumn = invalidColumn;
        }
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.columnSel.selectItem(name));

        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.columns, ind - 1);

        await this.performAction(() => click(this.content.columns[ind - 1].elem));

        return this.checkState();
    }

    async selectTemplateDateFormat(locale) {
        this.checkTplFormState();

        this.model.template.date_locale = locale;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.dateFormatSel.selectItem(locale));

        return this.checkState();
    }

    async inputTemplateFirstRow(val) {
        this.checkTplFormState();

        this.model.template.first_row = parseInt(val, 10);
        this.expectedState = this.getExpectedState();

        await this.performAction(() => input(this.content.firstRowInp.elem, val.toString()));

        return this.checkState();
    }

    async decreaseTemplateFirstRow() {
        this.checkTplFormState();

        assert(!this.content.decFirstRowBtn.disabled, 'Decrease first row button is disabled');

        this.model.template.first_row -= 1;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => click(this.content.decFirstRowBtn.elem));

        return this.checkState();
    }

    async increaseTemplateFirstRow() {
        this.checkTplFormState();

        assert(!this.content.incFirstRowBtn.disabled, 'Increase first row button is disabled');

        if (Number.isNaN(this.model.template.first_row)) {
            this.model.template.first_row = 1;
        } else {
            this.model.template.first_row += 1;
        }
        this.expectedState = this.getExpectedState();

        await this.performAction(() => click(this.content.incFirstRowBtn.elem));

        return this.checkState();
    }

    async toggleTemplateAccount() {
        this.checkTplFormState();

        if (this.model.template.account_id) {
            this.model.template.account_id = 0;
        } else {
            const account = App.state.getFirstAccount();
            this.model.template.account_id = account.id;
        }
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.tplAccountSwitch.toggle());

        return this.checkState();
    }

    async selectTemplateAccountById(val) {
        this.checkTplFormState();

        const account = App.state.accounts.getItem(val);
        this.model.template.account_id = account.id;
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.tplAccountSel.selectItem(val));

        return this.checkState();
    }

    async selectTemplateAccountByIndex(index) {
        const [itemId] = App.state.getAccountsByIndexes(index, true);
        return this.selectTemplateAccountById(itemId);
    }

    async submitTemplate() {
        const disabled = await prop(this.content.submitTplBtn.elem, 'disabled');

        const { template } = this.model;
        this.model.isValid = this.isValidTemplate(template);
        if (!this.model.isValid && disabled) {
            return true;
        }

        if (this.model.isValid) {
            this.model.state = CONVERT_STATE;

            if (template.account_id) {
                this.model.initialAccount = App.state.accounts.getItem(template.account_id);
            }
        }

        const expected = this.getExpectedState();

        assert(!disabled, 'Submit template button is disabled');
        await click(this.content.submitTplBtn.elem);
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.isTplLoading;
        });

        return this.checkState(expected);
    }

    getCurrentState() {
        return this.model.state;
    }

    getExpectedTemplate() {
        const res = structuredClone(this.model.template);

        if (res) {
            res.type_id = 0;
        }

        return res;
    }

    async cancelTemplate() {
        const { cancelTplBtn } = this.content;
        assert(cancelTplBtn.visible && !cancelTplBtn.disabled, 'Cancel template button is invisible or disabled');

        this.model.state = CONVERT_STATE;

        const template = App.state.templates.getItem(this.model.selectedTemplateId);
        this.model.template = template;
        if (template?.account_id) {
            this.model.initialAccount = App.state.accounts.getItem(template.account_id);
        }
        this.model.isValid = this.isValidTemplate(template);

        this.expectedState = this.getExpectedState();

        await this.performAction(() => click(this.content.cancelTplBtn.elem));

        return this.checkState();
    }

    async selectAccount(val) {
        this.model.initialAccount = App.state.accounts.getItem(val);
        this.expectedState = this.getExpectedState();

        await this.performAction(() => this.content.initialAccount.selectItem(val));

        return this.checkState();
    }

    async selectEncoding(val) {
        if (this.encode === !!val) {
            return;
        }

        await this.performAction(() => this.content.isEncodeCheck.toggle());
    }

    /** Returns array of ImportTransaction */
    getExpectedUploadResult(importData) {
        const tpl = App.state.templates.getItem(this.model.selectedTemplateId);

        return tpl.applyTo(importData, this.model.initialAccount);
    }

    async submit() {
        assert(this.content.submitBtn.visible, 'Submit button not visible');

        await click(this.content.submitBtn.elem);
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.uploadInProgress;
        });
    }

    /** Clicks on 'Back' button at upload dialog to return to select file stage */
    async backToSelectFile() {
        const isConvertState = this.model.state === CONVERT_STATE;
        const isFormState = this.isTemplateFormState();
        assert(isConvertState || isFormState, 'Invalid state');

        const { backBtn } = this.content;
        assert(backBtn.elem && backBtn.visible, 'Back button not available');

        this.model.state = BROWSE_FILE_STATE;
        this.model.filename = '';
        const expected = this.getExpectedState();

        await this.performAction(() => click(this.content.backBtn.elem));

        return this.checkState(expected);
    }
}
