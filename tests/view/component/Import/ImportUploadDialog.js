import {
    TestComponent,
    assert,
    query,
    queryAll,
    prop,
    click,
    input,
    select,
    isVisible,
    wait,
    waitForFunction,
    isNum,
    copyObject,
    evaluate,
    asyncMap,
} from 'jezve-test';
import {
    Checkbox,
    DropDown,
    IconButton,
    Switch,
} from 'jezvejs-test';
import { App } from '../../../Application.js';
import { fixFloat } from '../../../common.js';
import { WarningPopup } from '../WarningPopup.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
import { __ } from '../../../model/locale.js';

export const BROWSE_FILE_STATE = 1;
export const LOADING_STATE = 2;
export const CONVERT_STATE = 3;
export const CREATE_TPL_STATE = 4;
export const UPDATE_TPL_STATE = 5;

const TPL_FORM_STATES = [CREATE_TPL_STATE, UPDATE_TPL_STATE];

export class ImportUploadDialog extends TestComponent {
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
                menuBtn: await query(this.elem, '.template-select .popup-menu-btn'),
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
            decFirstRowBtn: { elem: await query('#decFirstRowBtn') },
            incFirstRowBtn: { elem: await query('#incFirstRowBtn') },
            // Template account field
            tplAccountSwitch: await Switch.create(this, await query(this.elem, '#tplAccountSwitch')),
            tplAccountField: { elem: await query('#tplAccountField') },
            tplAccountSel: await DropDown.create(this, await query('#tplAccountField .dd__container')),
            // Template column field
            columnField: { elem: await query('#columnField') },
            columnSel: { elem: await query('#columnSel') },
            // Template form
            rawDataTable: { elem: await query('#rawDataTable') },
            createTplBtn: { elem: await query('#createTplBtn') },
            submitTplBtn: { elem: await query('#submitTplBtn') },
            cancelTplBtn: { elem: await query('#cancelTplBtn') },
            tplFormFeedback: { elem: await query('#tplFormFeedback') },
            initialAccount: await DropDown.createFromChild(this, await query('#initialAccount')),
            submitBtn: { elem: await query(this.elem, '#submitUploadedBtn') },
        };
        Object.keys(res).forEach((child) => (
            assert(res[child]?.elem, `Invalid structure of ImportUploadDialog: ${child} component not found`)
        ));

        // Template select
        res.templateSelect.titleElem = await query(res.templateSelect.elem, '.template-select__title');
        // Template select context menu
        res.tplContextMenu = { elem: await query(this.elem, '.popup-menu-list') };
        if (res.tplContextMenu.elem) {
            res.updateTplBtn = await IconButton.create(
                this,
                await query(res.tplContextMenu.elem, '.update-btn'),
            );
            res.deleteTplBtn = await IconButton.create(
                this,
                await query(res.tplContextMenu.elem, '.delete-btn'),
            );
        }

        res.uploadProgress = { elem: await query(this.elem, ':scope > .loading-indicator') };
        res.loadingIndicator = { elem: await query(this.elem, '.tpl-form > .loading-indicator') };

        res.useServerAddress = res.useServerCheck.checked;
        res.encode = res.isEncodeCheck.checked;
        res.templateBlock.visible = await isVisible(res.templateBlock.elem);
        res.uploadProgress.visible = await isVisible(res.uploadProgress.elem);
        res.loadingIndicator.visible = await isVisible(res.loadingIndicator.elem);
        res.isLoading = (
            res.uploadProgress.visible
            || (res.templateBlock.visible && res.loadingIndicator.visible)
        );

        res.tplFormTitle = {};
        if (res.templateBlock.visible && !res.isLoading) {
            res.tplFormTitle.elem = await query(this.elem, '.template-form-title');
            assert(res.tplFormTitle.elem, 'Invalid state');
        }

        [
            res.fileName,
            res.serverAddress,
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
        ] = await evaluate(
            (fileEl, serverEl, tplEl, nameEl, inpEl, decBtn, incBtn, fbEl, formFbEl, titleEl) => ([
                fileEl.value,
                serverEl.value,
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
            ]),
            res.fileNameElem.elem,
            res.serverAddressInput.elem,
            res.templateSelect.titleElem,
            res.tplNameInp.elem,
            res.firstRowInp.elem,
            res.decFirstRowBtn.elem,
            res.incFirstRowBtn.elem,
            res.tplFeedback.elem,
            res.tplFormFeedback.elem,
            res.tplFormTitle.elem,
        );

        res.uploadFilename = (res.useServerAddress) ? res.serverAddress : res.fileName;
        res.isTplLoading = res.templateDropDown.disabled;

        res.columns = null;
        if (res.templateBlock.visible && !res.isLoading) {
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
            if (res.tplFormTitle.title === __('TEMPLATE_CREATE', App.view.locale)) {
                res.state = CREATE_TPL_STATE;
            } else if (res.tplFormTitle.title === __('TEMPLATE_UPDATE', App.view.locale)) {
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

        const res = {
            elem,
            tplElem: await query(elem, '.raw-data-column__tpl'),
            headerElem: await query(elem, '.raw-data-column__header'),
            cellElems: await queryAll(elem, '.raw-data-column__cell'),
        };

        res.cells = await asyncMap(res.cellElems, (cellElem) => prop(cellElem, 'textContent'));

        res.tplProperties = await asyncMap(
            await queryAll(res.tplElem, '.raw-data-column__tpl-prop'),
            (propElem) => prop(propElem, 'textContent'),
        );
        if (res.headerElem) {
            res.title = await prop(res.headerElem, 'textContent');
        }

        return res;
    }

    buildModel(cont) {
        const res = {};

        res.state = cont.state;
        res.uploadInProgress = cont.uploadProgress.visible;
        res.isTplLoading = cont.isTplLoading;
        res.isValid = cont.tplFeedback.isValid;
        res.isFormValid = cont.tplFormFeedback.isValid;

        res.useServerAddress = cont.useServerAddress;
        res.filename = cont.uploadFilename;
        res.fileData = cont.fileData;

        res.templateMenuVisible = res.tplContextMenu?.visible ?? false;

        res.selectedTemplateId = cont.templateDropDown?.value ?? 0;

        res.template = (cont.state === CREATE_TPL_STATE)
            ? {}
            : App.state.templates.getItem(res.selectedTemplateId);

        if (
            (cont.state === CREATE_TPL_STATE || cont.state === UPDATE_TPL_STATE)
            && res.template
        ) {
            res.template.name = cont.tplNameInp.value;
            res.template.first_row = parseInt(cont.firstRowInp.value, 10);
            res.template.account_id = (cont.tplAccountSwitch.checked)
                ? parseInt(cont.tplAccountSel.value, 10)
                : 0;

            res.template.columns = {};
            if (Array.isArray(cont.columns)) {
                const propTitleMap = {
                    accountAmount: __('COLUMN_ACCOUNT_AMOUNT', App.view.locale),
                    transactionAmount: __('COLUMN_TR_AMOUNT', App.view.locale),
                    accountCurrency: __('COLUMN_ACCOUNT_CURRENCY', App.view.locale),
                    transactionCurrency: __('COLUMN_TR_CURRENCY', App.view.locale),
                    date: __('COLUMN_DATE', App.view.locale),
                    comment: __('COLUMN_COMMENT', App.view.locale),
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

    getColumn(data, index) {
        const rowsToShow = 2;
        const headerRow = data.slice(0, 1)[0];
        const ind = parseInt(index, 10);
        assert.arrayIndex(headerRow, ind);

        const res = {
            title: headerRow[ind],
        };

        const cellsData = data.slice(1, rowsToShow + 1);
        res.cells = cellsData.map((row) => {
            const val = row[ind];
            if (isNum(val)) {
                return parseFloat(val).toString();
            }

            return val;
        });

        return res;
    }

    getExpectedState(model) {
        const isBrowseState = model.state === BROWSE_FILE_STATE;
        const isLoadingState = model.state === LOADING_STATE;
        const isConvertState = model.state === CONVERT_STATE;
        const isFormState = this.isTemplateFormState(model);
        const res = {
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
        // Template form
        res.templateForm = { visible: isFormState };
        res.rawDataTable = { visible: isFormState };
        res.nameField = { visible: isFormState };
        res.firstRowField = { visible: isFormState };
        res.columnField = { visible: isFormState };
        res.tplFormFeedback = { visible: isFormState };
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
                disabled: (firstRow <= 1),
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
        }

        if (isBrowseState) {
            res.uploadFilename = model.filename;
        }

        res.submitBtn = { visible: isConvertState && model.isValid };

        if ([CREATE_TPL_STATE, UPDATE_TPL_STATE].includes(model.state)) {
            const [rawDataHeader] = this.parent.fileData.slice(0, 1);
            res.columns = rawDataHeader.map(
                (_, ind) => this.getColumn(this.parent.fileData, ind),
            );
            res.rowNumbers = {
                cells: ['1'],
            };

            const firstRowInd = (Number.isNaN(model.template.first_row))
                ? 1
                : model.template.first_row;

            const firstRowIndex = Math.max(firstRowInd, 2);
            for (let i = 0; i < 3; i += 1) {
                const rowNumber = firstRowIndex + i;
                res.rowNumbers.cells.push(rowNumber.toString());
            }
        }

        return res;
    }

    isValidTemplate(template = this.model.template) {
        if (!template || !template.columns) {
            return false;
        }

        if (template.name.length === 0) {
            return false;
        }
        if (Number.isNaN(template.first_row) || template.first_row < 1) {
            return false;
        }

        const tplProp = [
            'accountAmount',
            'transactionAmount',
            'accountCurrency',
            'transactionCurrency',
            'date',
            'comment',
        ];

        const [dataRow] = this.parent.fileData.slice(template.first_row, template.first_row + 1);
        const fileColumns = dataRow?.length ?? 0;

        return tplProp.every((property) => {
            if (!(property in template.columns)) {
                return false;
            }

            const propValue = template.columns[property];
            if (propValue < 1 || propValue > fileColumns) {
                return false;
            }

            if (property === 'accountAmount' || property === 'transactionAmount') {
                const val = dataRow[propValue - 1];
                if (!parseFloat(fixFloat(val))) {
                    return false;
                }
            }

            return true;
        });
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
        this.expectedState = this.getExpectedState(this.model);

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
            this.model.template = {
                name: '',
                account_id: 0,
                first_row: 2,
                columns: {},
            };
        }
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(async () => {
            await click(this.content.serverUploadBtn.elem);

            await wait('#templateBlock', { visible: true });
            await wait('.tpl-form > .loading-indicator', { hidden: true });
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
        this.expectedState = this.getExpectedState(this.model);

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
        this.model.template = {
            name: '',
            first_row: 2,
            columns: {},
        };
        this.expectedState = this.getExpectedState(this.model);

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
        this.model.template = App.state.templates.getItem(this.content.templateDropDown.value);
        this.expectedState = this.getExpectedState(this.model);

        await this.openTemplateMenu();
        await this.performAction(() => this.content.updateTplBtn.click());

        return this.checkState();
    }

    async deleteTemplate() {
        this.checkRawDataState();

        if (this.content.templateDropDown.items.length === 1) {
            this.model.state = CREATE_TPL_STATE;
            this.model.template = {
                name: '',
                first_row: 2,
                columns: {},
            };
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

        this.expectedState = this.getExpectedState(this.model);

        await this.openTemplateMenu();
        await this.performAction(() => this.content.deleteTplBtn.click());

        assert(this.content.delete_warning?.content?.visible, 'Delete template warning popup not appear');
        assert(this.content.delete_warning.content.okBtn, 'OK button not found');

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
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => input(this.content.tplNameInp.elem, val));

        return this.checkState();
    }

    async selectTemplateColumn(name, index) {
        this.checkTplFormState();

        this.model.template.columns[name] = index;
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => select(this.content.columnSel.elem, name.toString()));

        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.columns, ind - 1);

        await this.performAction(() => click(this.content.columns[ind - 1].elem));

        return this.checkState();
    }

    async inputTemplateFirstRow(val) {
        this.checkTplFormState();

        this.model.template.first_row = parseInt(val, 10);
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => input(this.content.firstRowInp.elem, val.toString()));

        return this.checkState();
    }

    async decreaseTemplateFirstRow() {
        this.checkTplFormState();

        assert(!this.content.decFirstRowBtn.disabled, 'Decrease first row button is disabled');

        this.model.template.first_row -= 1;
        this.expectedState = this.getExpectedState(this.model);

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
        this.expectedState = this.getExpectedState(this.model);

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
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.tplAccountSwitch.toggle());

        return this.checkState();
    }

    async selectTemplateAccountById(val) {
        this.checkTplFormState();

        const account = App.state.accounts.getItem(val);
        this.model.template.account_id = account.id;
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => this.content.tplAccountSel.selectItem(val));

        return this.checkState();
    }

    async selectTemplateAccountByIndex(index) {
        const [itemId] = App.state.getAccountsByIndexes(index, true);
        return this.selectTemplateAccountById(itemId);
    }

    async submitTemplate() {
        const disabled = await prop(this.content.submitTplBtn.elem, 'disabled');
        assert(!disabled, 'Submit template button is disabled');

        const { template } = this.model;
        this.model.isValid = this.isValidTemplate(template);
        if (this.model.isValid) {
            this.model.state = CONVERT_STATE;

            if (template.account_id) {
                this.model.initialAccount = App.state.accounts.getItem(template.account_id);
            }
        }

        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.submitTplBtn.elem);
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.isTplLoading;
        });

        return this.checkState();
    }

    getCurrentState() {
        return this.model.state;
    }

    getExpectedTemplate() {
        const res = copyObject(this.model.template);

        if (res) {
            res.type_id = 0;
        }

        return res;
    }

    async cancelTemplate() {
        const visible = await isVisible(this.content.cancelTplBtn.elem, true);
        const disabled = await prop(this.content.cancelTplBtn.elem, 'disabled');
        assert(visible && !disabled, 'Cancel template button is invisible or disabled');

        this.model.state = CONVERT_STATE;

        const template = App.state.templates.getItem(this.model.selectedTemplateId);
        this.model.template = template;
        if (template?.account_id) {
            this.model.initialAccount = App.state.accounts.getItem(template.account_id);
        }
        this.model.isValid = this.isValidTemplate(template);

        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => click(this.content.cancelTplBtn.elem));

        return this.checkState();
    }

    async selectAccount(val) {
        this.model.initialAccount = App.state.accounts.getItem(val);
        this.expectedState = this.getExpectedState(this.model);

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
        const tpl = new ImportTemplate(this.model.template);

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
}
