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
import { Checkbox, DropDown } from 'jezvejs-test';
import { App } from '../../../Application.js';
import { fixFloat } from '../../../common.js';
import { WarningPopup } from '../WarningPopup.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
import { __ } from '../../../model/locale.js';

export const BROWSE_FILE_STATE = 1;
export const LOADING_STATE = 2;
export const RAW_DATA_STATE = 3;
export const CREATE_TPL_STATE = 4;
export const UPDATE_TPL_STATE = 5;

const TPL_FORM_STATES = [CREATE_TPL_STATE, UPDATE_TPL_STATE];

export class ImportUploadDialog extends TestComponent {
    async parseContent() {
        assert(this.elem, 'Invalid import upload dialog element');

        const res = {};

        res.closeBtn = await query(this.elem, '.close-btn');
        assert(res.closeBtn, 'Invalid popup: cllose button not found');

        // Upload form
        res.fileBlock = { elem: await query('#fileBlock') };
        res.uploadFormBrowser = { elem: await query(this.elem, '.upload-form__browser') };
        res.fileNameElem = { elem: await query(this.elem, '.upload-form__filename') };
        res.isEncodeCheck = await Checkbox.create(this, await query(this.elem, '#isEncodeCheck'));
        res.uploadProgress = { elem: await query(this.elem, ':scope > .loading-indicator') };
        // Server address input
        res.useServerCheck = await Checkbox.create(this, await query('#useServerCheck'));
        res.serverAddressBlock = { elem: await query('#serverAddressBlock') };
        res.serverAddressInput = { elem: await query('#serverAddress') };
        res.serverUploadBtn = { elem: await query('#serverUploadBtn') };
        assert(
            res.fileBlock.elem
            && res.uploadFormBrowser.elem
            && res.fileNameElem.elem
            && res.isEncodeCheck.elem
            && res.useServerCheck.elem
            && res.serverAddressBlock.elem
            && res.serverAddressInput.elem
            && res.serverUploadBtn.elem,
            'Invalid file upload form',
        );

        res.useServerAddress = res.useServerCheck.checked;
        res.encode = res.isEncodeCheck.checked;

        // Convert block
        res.templateBlock = { elem: await query('#templateBlock') };
        res.tplHeading = { elem: await query('#tplHeading') };
        res.tplStateLbl = { elem: await query('#tplStateLbl') };
        assert(
            res.templateBlock.elem
            && res.tplHeading.elem
            && res.tplStateLbl.elem,
            'Invalid convert block',
        );

        // Template select field
        res.tplField = { elem: await query('#tplField') };
        res.templateSel = await DropDown.createFromChild(this, await query(this.elem, '#templateSel'));
        assert(res.tplField.elem && res.templateSel, 'Invalid template select field');

        // Template name field
        res.nameField = { elem: await query('#nameField') };
        res.tplNameInp = { elem: await query('#tplNameInp') };
        assert(res.nameField.elem && res.tplNameInp.elem, 'Invalid template name field');

        // First row field
        res.firstRowField = { elem: await query('#firstRowField') };
        res.firstRowInp = { elem: await query('#firstRowInp') };
        res.decFirstRowBtn = { elem: await query('#decFirstRowBtn') };
        res.incFirstRowBtn = { elem: await query('#incFirstRowBtn') };
        assert(
            res.firstRowField.elem
            && res.firstRowInp.elem
            && res.decFirstRowBtn.elem
            && res.incFirstRowBtn.elem,
            'Invalid first row field',
        );

        [
            res.fileName,
            res.serverAddress,
            res.tplNameInp.value,
            res.firstRowInp.value,
            res.decFirstRowBtn.disabled,
            res.incFirstRowBtn.disabled,
        ] = await evaluate(
            (fileNameEl, serverEl, tplNameEl, inputEl, decBtn, incBtn) => ([
                fileNameEl.value,
                serverEl.value,
                tplNameEl.value,
                inputEl.value,
                decBtn.disabled,
                incBtn.disabled,
            ]),
            res.fileNameElem.elem,
            res.serverAddressInput.elem,
            res.tplNameInp.elem,
            res.firstRowInp.elem,
            res.decFirstRowBtn.elem,
            res.incFirstRowBtn.elem,
        );
        res.uploadFilename = (res.useServerAddress) ? res.serverAddress : res.fileName;

        // Template account field
        res.tplAccountField = { elem: await query('#tplAccountField') };
        res.tplAccountCheck = await Checkbox.create(this, await query(this.elem, '#tplAccountCheck'));
        const tplAccountSelElem = await query(this.elem, '#tplAccountCheck + .dd__container');
        res.tplAccountSel = await DropDown.create(this, tplAccountSelElem);
        assert(res.tplAccountField.elem && res.tplAccountSel, 'Invalid template account field');

        // Template column field
        res.columnField = { elem: await query('#columnField') };
        res.columnSel = { elem: await query('#columnSel') };
        assert(res.columnField.elem && res.columnSel.elem, 'Invalid template column field');

        // Template form
        res.rawDataTable = { elem: await query('#rawDataTable') };
        res.createTplBtn = { elem: await query('#createTplBtn') };
        res.updateTplBtn = { elem: await query('#updateTplBtn') };
        res.deleteTplBtn = { elem: await query('#deleteTplBtn') };
        res.submitTplBtn = { elem: await query('#submitTplBtn') };
        res.cancelTplBtn = { elem: await query('#cancelTplBtn') };
        res.tplFeedback = { elem: await query('#tplFeedback') };
        res.initialAccount = await DropDown.createFromChild(this, await query('#initialAccount'));
        res.submitBtn = { elem: await query(this.elem, '#submitUploadedBtn') };
        res.loadingIndicator = { elem: await query(this.elem, '.tpl-form > .loading-indicator') };

        assert(
            res.rawDataTable.elem
            && res.createTplBtn.elem
            && res.updateTplBtn.elem
            && res.deleteTplBtn.elem
            && res.submitTplBtn.elem
            && res.cancelTplBtn.elem
            && res.tplFeedback.elem
            && res.initialAccount
            && res.submitBtn.elem,
            'Invalid template form',
        );

        res.isTplLoading = res.templateSel.disabled;

        res.templateBlock.visible = await isVisible(res.templateBlock.elem);
        res.uploadProgress.visible = await isVisible(res.uploadProgress.elem);
        res.loadingIndicator.visible = await isVisible(res.loadingIndicator.elem);
        res.isLoading = (
            res.uploadProgress.visible
            || (res.templateBlock.visible && res.loadingIndicator.visible)
        );
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

        [
            res.tplFeedback.title,
            res.tplFeedback.isValid,
        ] = await evaluate((feedbackEl) => ([
            feedbackEl.textContent,
            feedbackEl.classList.contains('valid-feedback'),
        ]), res.tplFeedback.elem);

        if (res.isLoading) {
            res.state = LOADING_STATE;
        } else if (res.templateBlock.visible) {
            const stateLabel = await prop(res.tplStateLbl.elem, 'textContent');
            if (stateLabel === __('TEMPLATE_CREATE', App.view.locale)) {
                res.state = CREATE_TPL_STATE;
            } else if (stateLabel === __('TEMPLATE_UPDATE', App.view.locale)) {
                res.state = UPDATE_TPL_STATE;
            } else {
                res.state = RAW_DATA_STATE;
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

        res.useServerAddress = cont.useServerAddress;
        res.filename = cont.uploadFilename;
        res.fileData = cont.fileData;

        res.selectedTemplateId = cont.templateSel?.value ?? 0;

        res.template = (cont.state === CREATE_TPL_STATE)
            ? {}
            : App.state.templates.getItem(res.selectedTemplateId);

        if (
            (cont.state === CREATE_TPL_STATE || cont.state === UPDATE_TPL_STATE)
            && res.template
        ) {
            res.template.name = cont.tplNameInp.value;
            res.template.first_row = parseInt(cont.firstRowInp.value, 10);
            res.template.account_id = (cont.tplAccountCheck.checked)
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
        this.assertStateId(RAW_DATA_STATE);
    }

    checkTplFormState() {
        assert(TPL_FORM_STATES.includes(this.model.state), `Invalid state: ${this.model.state}`);
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
        const res = {
            uploadFormBrowser: { visible: isBrowseState },
            isEncodeCheck: { visible: isBrowseState },
            serverAddressBlock: { visible: isBrowseState && model.useServerAddress },
            columns: null,
            initialAccount: { value: model.initialAccount.id.toString() },
        };

        if (model.state === CREATE_TPL_STATE || model.state === UPDATE_TPL_STATE) {
            assert(model.template, 'Invalid model: expected template');

            res.fileBlock = { visible: false };
            res.templateBlock = { visible: true };
            res.loadingIndicator = { visible: false };
            res.tplField = { visible: false };
            res.nameField = { visible: true };
            res.firstRowField = { visible: true };
            res.columnField = { visible: true };
            res.rawDataTable = { visible: true };
            res.updateTplBtn = { visible: false };
            res.deleteTplBtn = { visible: false };
            res.submitTplBtn = { visible: true };
            res.tplFeedback = { visible: true };

            const showCancelBtn = (model.state === CREATE_TPL_STATE)
                ? (App.state.templates.length > 0)
                : true;
            res.cancelTplBtn = { visible: showCancelBtn };
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
            res.tplAccountCheck = {
                visible: true,
                checked: useAccount,
            };
            res.tplAccountSel = {
                visible: useAccount,
            };
            if (useAccount) {
                res.tplAccountSel.value = model.template.account_id.toString();
            }
        } else if (model.state === RAW_DATA_STATE) {
            res.fileBlock = { visible: false };
            res.templateBlock = { visible: true };
            res.loadingIndicator = { visible: false };
            res.tplField = { visible: true };
            res.nameField = { visible: false };
            res.firstRowField = { visible: false };
            res.columnField = { visible: false };
            res.rawDataTable = { visible: false };
            res.updateTplBtn = { visible: true };
            res.deleteTplBtn = { visible: true };
            res.submitTplBtn = { visible: false };
            res.cancelTplBtn = { visible: false };
            res.tplFeedback = { visible: true };
        } else if (model.state === LOADING_STATE) {
            res.templateBlock = { visible: true };
            res.loadingIndicator = { visible: true };
            res.nameField = { visible: false };
            res.firstRowField = { visible: false };
            res.columnField = { visible: false };
            res.rawDataTable = { visible: false };
            res.updateTplBtn = { visible: true };
            res.deleteTplBtn = { visible: true };
            res.submitTplBtn = { visible: false };
            res.cancelTplBtn = { visible: false };
        } else if (model.state === BROWSE_FILE_STATE) {
            res.uploadFilename = model.filename;

            res.fileBlock = { visible: true };
            res.templateBlock = { visible: false };
            res.loadingIndicator = { visible: false };
            res.nameField = { visible: false };
            res.firstRowField = { visible: false };
            res.columnField = { visible: false };
            res.rawDataTable = { visible: false };
            res.updateTplBtn = { visible: false };
            res.deleteTplBtn = { visible: false };
            res.submitTplBtn = { visible: false };
            res.cancelTplBtn = { visible: false };
            res.tplFeedback = { visible: false };
        }

        res.submitBtn = { visible: model.state === RAW_DATA_STATE && model.isValid };

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
        await click(this.content.closeBtn);
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
            this.model.state = RAW_DATA_STATE;

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

        await this.performAction(() => this.content.templateSel.selectItem(val));

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

    async updateTemplate() {
        this.checkRawDataState();

        this.model.state = UPDATE_TPL_STATE;
        this.model.template = App.state.templates.getItem(this.content.templateSel.value);
        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => click(this.content.updateTplBtn.elem));

        return this.checkState();
    }

    async deleteTemplate() {
        this.checkRawDataState();

        if (this.content.templateSel.items.length === 1) {
            this.model.state = CREATE_TPL_STATE;
            this.model.template = {
                name: '',
                first_row: 2,
                columns: {},
            };
        } else {
            this.model.state = RAW_DATA_STATE;
            const currentInd = this.content.templateSel.items.findIndex(
                (item) => item.id === this.content.templateSel.value,
            );
            const newInd = (currentInd > 0) ? 0 : 1;
            const newTplId = this.content.templateSel.items[newInd].id;
            const template = App.state.templates.getItem(newTplId);
            this.model.template = template;
            if (template?.account_id) {
                this.model.initialAccount = App.state.accounts.getItem(template.account_id);
            }
        }

        this.expectedState = this.getExpectedState(this.model);

        await this.performAction(() => click(this.content.deleteTplBtn.elem));

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

        await this.performAction(() => this.content.tplAccountCheck.toggle());

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
            this.model.state = RAW_DATA_STATE;

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

        this.model.state = RAW_DATA_STATE;

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
