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
} from 'jezve-test';
import { Checkbox, DropDown } from 'jezvejs/tests';
import { App } from '../../../Application.js';
import { asyncMap, fixFloat } from '../../../common.js';
import { WarningPopup } from '../WarningPopup.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';

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

        res.fileBlock = { elem: await query('#fileBlock') };

        res.uploadFormBrowser = { elem: await query(this.elem, '.upload-form__browser') };
        res.fileNameElem = { elem: await query(this.elem, '.upload-form__filename') };
        res.templateSel = await DropDown.createFromChild(this, await query(this.elem, '#templateSel'));
        res.isEncodeCheck = await Checkbox.create(this, await query(this.elem, '#isEncodeCheck'));
        res.submitBtn = { elem: await query(this.elem, '#submitUploadedBtn') };
        res.uploadProgress = { elem: await query(this.elem, ':scope > .loading-indicator') };

        res.useServerCheck = await Checkbox.create(this, await query('#useServerCheck'));
        res.serverAddressBlock = { elem: await query('#serverAddressBlock') };
        res.serverAddressInput = { elem: await query('#serverAddress') };
        res.serverUploadBtn = { elem: await query('#serverUploadBtn') };

        res.templateBlock = { elem: await query('#templateBlock') };
        res.tplHeading = { elem: await query('#tplHeading') };
        res.tplStateLbl = { elem: await query('#tplStateLbl') };
        res.tplField = { elem: await query('#tplField') };
        res.nameField = { elem: await query('#nameField') };
        res.tplNameInp = { elem: await query('#tplNameInp') };
        res.columnField = { elem: await query('#columnField') };
        res.columnSel = { elem: await query('#columnSel') };
        res.loadingIndicator = { elem: await query(this.elem, '.tpl-form > .loading-indicator') };
        res.rawDataTable = { elem: await query('#rawDataTable') };
        res.createTplBtn = { elem: await query('#createTplBtn') };
        res.updateTplBtn = { elem: await query('#updateTplBtn') };
        res.deleteTplBtn = { elem: await query('#deleteTplBtn') };
        res.submitTplBtn = { elem: await query('#submitTplBtn') };
        res.cancelTplBtn = { elem: await query('#cancelTplBtn') };
        res.tplFeedback = { elem: await query('#tplFeedback') };
        res.initialAccount = await DropDown.createFromChild(this, await query('#initialAccount'));

        assert(
            res.closeBtn
            && res.fileBlock.elem
            && res.uploadFormBrowser.elem
            && res.fileNameElem.elem
            && res.templateSel
            && res.isEncodeCheck.elem
            && res.useServerCheck.elem
            && res.serverAddressBlock.elem
            && res.serverAddressInput.elem
            && res.serverUploadBtn.elem
            && res.templateBlock.elem
            && res.tplHeading.elem
            && res.tplStateLbl.elem
            && res.tplField.elem
            && res.nameField.elem
            && res.tplNameInp.elem
            && res.columnField.elem
            && res.columnSel.elem
            && res.rawDataTable.elem
            && res.createTplBtn.elem
            && res.updateTplBtn.elem
            && res.deleteTplBtn.elem
            && res.submitTplBtn.elem
            && res.cancelTplBtn.elem
            && res.tplFeedback.elem
            && res.initialAccount,
            'Failed to initialize extras of file upload dialog',
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
                await queryAll(res.rawDataTable.elem, '.raw-data-column'),
                async (elem) => {
                    const item = {
                        elem,
                        tplElem: await query(elem, '.raw-data-column__tpl'),
                        headerElem: await query(elem, '.raw-data-column__header'),
                        cellElems: await queryAll(elem, '.raw-data-column__cell'),
                    };

                    item.cells = await asyncMap(item.cellElems, (cellElem) => prop(cellElem, 'textContent'));

                    item.tplProperties = await asyncMap(
                        await queryAll(item.tplElem, '.raw-data-column__tpl-prop'),
                        (propElem) => prop(propElem, 'textContent'),
                    );
                    item.title = await prop(item.headerElem, 'textContent');

                    return item;
                },
            );

            if (!res.columns.length) {
                res.columns = null;
            }
        }

        res.fileName = await prop(res.fileNameElem.elem, 'value');
        res.useServerAddress = res.useServerCheck.checked;
        res.serverAddress = await prop(res.serverAddressInput.elem, 'value');
        res.encode = res.isEncodeCheck.checked;
        res.uploadFilename = (res.useServerAddress) ? res.serverAddress : res.fileName;

        res.tplNameInp.value = await prop(res.tplNameInp.elem, 'value');
        res.tplFeedback.title = await prop(res.tplFeedback.elem, 'textContent');

        if (res.isLoading) {
            res.state = LOADING_STATE;
        } else if (res.templateBlock.visible) {
            const stateLabel = await prop(res.tplStateLbl.elem, 'textContent');
            if (stateLabel === 'Create template') {
                res.state = CREATE_TPL_STATE;
            } else if (stateLabel === 'Update template') {
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

    async buildModel(cont) {
        const res = {};

        res.state = cont.state;
        res.uploadInProgress = cont.uploadProgress.visible;
        res.isTplLoading = cont.isTplLoading;

        res.useServerAddress = cont.useServerAddress;
        res.filename = cont.uploadFilename;
        res.fileData = cont.fileData;

        res.template = null;

        if (cont.state === CREATE_TPL_STATE) {
            res.template = {};
            res.template.name = cont.tplNameInp.value;
        } else if (cont.state === UPDATE_TPL_STATE) {
            res.template = App.state.templates.getItem(cont.templateSel.value);
            res.template.name = cont.tplNameInp.value;
        } else {
            res.template = App.state.templates.getItem(cont.templateSel.value);
        }

        if (
            (cont.state === CREATE_TPL_STATE || cont.state === UPDATE_TPL_STATE)
            && res.template
        ) {
            res.template.columns = {};
            if (Array.isArray(cont.columns)) {
                cont.columns.forEach((column, ind) => {
                    const propTitleMap = {
                        accountAmount: 'Account amount',
                        transactionAmount: 'Transaction amount',
                        accountCurrency: 'Account currency',
                        transactionCurrency: 'Transaction currency',
                        date: 'Date',
                        comment: 'Comment',
                    };

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

        if (model.state === CREATE_TPL_STATE
            || model.state === UPDATE_TPL_STATE) {
            if (model.state === UPDATE_TPL_STATE) {
                assert(model.template, 'Invalid model: expected template');
            }

            res.fileBlock = { visible: false };
            res.templateBlock = { visible: true };
            res.loadingIndicator = { visible: false };
            res.tplField = { visible: false };
            res.nameField = { visible: true };
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
            const tplName = (model.template) ? model.template.name : '';
            res.tplNameInp = { value: tplName };
        } else if (model.state === RAW_DATA_STATE) {
            res.fileBlock = { visible: false };
            res.templateBlock = { visible: true };
            res.loadingIndicator = { visible: false };
            res.tplField = { visible: true };
            res.nameField = { visible: false };
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
            res.columnField = { visible: false };
            res.rawDataTable = { visible: false };
            res.updateTplBtn = { visible: false };
            res.deleteTplBtn = { visible: false };
            res.submitTplBtn = { visible: false };
            res.cancelTplBtn = { visible: false };
            res.tplFeedback = { visible: false };
        }

        if ([CREATE_TPL_STATE, UPDATE_TPL_STATE].includes(model.state)) {
            const [rawDataHeader] = this.parent.fileData.slice(0, 1);
            res.columns = rawDataHeader.map(
                (_, ind) => this.getColumn(this.parent.fileData, ind),
            );
        }

        return res;
    }

    isValidTemplate(template) {
        if (!template || !template.columns) {
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

        const res = tplProp.every((property) => {
            if (!(property in template.columns)) {
                return false;
            }

            const propValue = template.columns[property];
            if (propValue < 1 || propValue > this.content.columns.length) {
                return false;
            }

            if (property === 'accountAmount' || property === 'transactionAmount') {
                const val = this.content.columns[propValue - 1].cells[0];
                if (!parseFloat(fixFloat(val))) {
                    return false;
                }
            }

            return true;
        });
        if (!res) {
            return false;
        }

        return true;
    }

    async close() {
        await click(this.content.closeBtn);
    }

    async toggleServerAddress() {
        this.checkBrowseFileState();

        await this.content.useServerCheck.toggle();
        await this.parse();
    }

    async setFile(filename) {
        this.checkBrowseFileState();
        assert.isString(filename, 'Invalid parameter');

        if (!this.content.useServerAddress) {
            await this.toggleServerAddress();
        }

        this.model.filename = filename;
        this.expectedState = this.getExpectedState(this.model);

        await input(this.content.serverAddressInput.elem, filename);
        await this.parse();

        return this.checkState();
    }

    async upload() {
        this.checkBrowseFileState();
        assert(this.model.filename?.length, 'File name not set');

        if (App.state.templates.length > 0) {
            this.model.state = RAW_DATA_STATE;

            const template = this.findValidTemplate(this.parent.fileData);
            if (template) {
                this.model.template = template;
            }
        } else {
            this.model.state = CREATE_TPL_STATE;
        }
        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.serverUploadBtn.elem);

        await wait('#templateBlock', { visible: true });
        await wait('.tpl-form > .loading-indicator', { hidden: true });
        await this.parse();

        return this.checkState();
    }

    async selectTemplateById(val) {
        this.checkRawDataState();

        this.model.template = App.state.templates.getItem(val);
        this.expectedState = this.getExpectedState(this.model);

        this.content.templateSel.selectItem(val);
        await this.parse();

        return this.checkState();
    }

    async selectTemplateByIndex(val) {
        const itemId = App.state.templates.indexToId(val);
        return this.selectTemplateById(itemId);
    }

    async createTemplate() {
        this.checkRawDataState();

        this.model.state = CREATE_TPL_STATE;
        this.model.template = null;
        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.createTplBtn.elem);
        await this.parse();

        return this.checkState();
    }

    async updateTemplate() {
        this.checkRawDataState();

        this.model.state = UPDATE_TPL_STATE;
        this.model.template = App.state.templates.getItem(this.content.templateSel.content.value);
        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.updateTplBtn.elem);
        await this.parse();

        return this.checkState();
    }

    async deleteTemplate() {
        this.checkRawDataState();

        if (this.content.templateSel.content.items.length === 1) {
            this.model.state = CREATE_TPL_STATE;
            this.model.template = null;
        } else {
            this.model.state = RAW_DATA_STATE;
            const currentInd = this.content.templateSel.content.items.findIndex(
                (item) => item.id === this.content.templateSel.content.value,
            );
            const newInd = (currentInd > 0) ? 0 : 1;
            const newTplId = this.content.templateSel.content.items[newInd].id;
            this.model.template = App.state.templates.getItem(newTplId);
        }

        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.deleteTplBtn.elem);
        await this.parse();

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

        await input(this.content.tplNameInp.elem, val);
        await this.parse();

        return this.checkState();
    }

    async selectTemplateColumn(name, index) {
        this.checkTplFormState();

        this.model.template.columns[name] = index;
        this.expectedState = this.getExpectedState(this.model);

        await select(this.content.columnSel.elem, name.toString());
        await this.parse();

        const ind = parseInt(index, 10);
        assert.arrayIndex(this.content.columns, ind - 1);

        await click(this.content.columns[ind - 1].elem);
        await this.parse();

        return this.checkState();
    }

    async submitTemplate() {
        const disabled = await prop(this.content.submitTplBtn.elem, 'disabled');
        assert(!disabled, 'Submit template button is disabled');

        const isValid = this.isValidTemplate(this.model.template);
        if (isValid) {
            this.model.state = RAW_DATA_STATE;
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
        this.expectedState = this.getExpectedState(this.model);

        await click(this.content.cancelTplBtn.elem);
        await this.parse();

        return this.checkState();
    }

    async selectAccount(val) {
        this.model.initialAccount = App.state.accounts.getItem(val);
        this.expectedState = this.getExpectedState(this.model);

        await this.content.initialAccount.selectItem(val);
        await this.parse();

        return this.checkState();
    }

    async selectEncoding(val) {
        if (this.encode === !!val) {
            return;
        }

        await this.content.isEncodeCheck.toggle();
        await this.parse();
    }

    /** Find valid template for data */
    findValidTemplate(data) {
        return App.state.templates.find((template) => {
            const tpl = new ImportTemplate(template);
            return tpl.isValid(data);
        });
    }

    getExpectedUploadResult(importData) {
        const tpl = new ImportTemplate(this.model.template);

        return tpl.applyTo(importData, this.model.initialAccount);
    }

    async submit() {
        await click(this.content.submitBtn.elem);
        await waitForFunction(async () => {
            await this.parse();
            return !this.model.uploadInProgress;
        });
    }
}
