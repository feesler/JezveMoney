import { Component } from './component.js';
import { App } from '../../app.js';
import {
    asyncMap,
    setParam,
    fixFloat,
    isNum,
    copyObject,
} from '../../common.js';
import { WarningPopup } from './warningpopup.js';

export const BROWSE_FILE_STATE = 1;
export const LOADING_STATE = 2;
export const RAW_DATA_STATE = 3;
export const CREATE_TPL_STATE = 4;
export const UPDATE_TPL_STATE = 5;

export class ImportUploadDialog extends Component {
    async parse() {
        if (!this.elem) {
            throw new Error('Invalid import upload dialog element');
        }

        this.closeBtn = await this.query(this.elem, '.close-btn');

        this.uploadFormBrowser = { elem: await this.query(this.elem, '.upload-form__browser') };
        this.fileNameElem = { elem: await this.query(this.elem, '.upload-form__filename') };
        this.templateSel = { elem: await this.query(this.elem, '#templateSel') };
        this.isEncodeCheck = { elem: await this.query(this.elem, '#isEncodeCheck') };
        this.submitBtn = { elem: await this.query(this.elem, '#submitUploadedBtn') };

        this.useServerCheck = { elem: await this.query('#useServerCheck') };
        this.serverAddressBlock = { elem: await this.query('#serverAddressBlock') };
        this.serverAddressInput = { elem: await this.query('#serverAddress') };
        this.serverUploadBtn = { elem: await this.query('#serverUploadBtn') };

        this.templateBlock = { elem: await this.query('#templateBlock') };
        this.tplHeading = { elem: await this.query('#tplHeading') };
        this.tplStateLbl = { elem: await this.query('#tplStateLbl') };
        this.tplField = { elem: await this.query('#tplField') };
        this.nameField = { elem: await this.query('#nameField') };
        this.tplNameInp = { elem: await this.query('#tplNameInp') };
        this.columnField = { elem: await this.query('#columnField') };
        this.columnSel = { elem: await this.query('#columnSel') };
        this.loadingIndicator = { elem: await this.query('#loadingIndicator') };
        this.rawDataTable = { elem: await this.query('#rawDataTable') };
        this.createTplBtn = { elem: await this.query('#createTplBtn') };
        this.updateTplBtn = { elem: await this.query('#updateTplBtn') };
        this.deleteTplBtn = { elem: await this.query('#deleteTplBtn') };
        this.submitTplBtn = { elem: await this.query('#submitTplBtn') };
        this.cancelTplBtn = { elem: await this.query('#cancelTplBtn') };
        this.tplFeedback = { elem: await this.query('#tplFeedback') };
        this.initialAccount = { elem: await this.query('#initialAccount') };
        if (
            !this.closeBtn
            || !this.uploadFormBrowser.elem
            || !this.fileNameElem.elem
            || !this.templateSel.elem
            || !this.isEncodeCheck.elem
            || !this.useServerCheck.elem
            || !this.serverAddressBlock.elem
            || !this.serverAddressInput.elem
            || !this.serverUploadBtn.elem
            || !this.templateBlock.elem
            || !this.tplHeading.elem
            || !this.tplStateLbl.elem
            || !this.tplField.elem
            || !this.nameField.elem
            || !this.tplNameInp.elem
            || !this.columnField.elem
            || !this.columnSel.elem
            || !this.loadingIndicator.elem
            || !this.rawDataTable.elem
            || !this.createTplBtn.elem
            || !this.updateTplBtn.elem
            || !this.deleteTplBtn.elem
            || !this.submitTplBtn.elem
            || !this.cancelTplBtn.elem
            || !this.tplFeedback.elem
            || !this.initialAccount.elem
        ) {
            throw new Error('Failed to initialize extras of file upload dialog');
        }

        this.templateSel.disabled = await this.prop(this.templateSel.elem, 'disabled');
        this.templateSel.options = await asyncMap(
            await this.queryAll(this.templateSel.elem, 'option'),
            async (elem) => ({
                elem,
                value: await this.prop(elem, 'value'),
                title: await this.prop(elem, 'textContent'),
            }),
        );
        this.isTplLoading = this.templateSel.disabled;

        this.isLoading = await this.isVisible(this.loadingIndicator.elem, true);
        this.columns = null;
        if (!this.isLoading) {
            this.columns = await asyncMap(
                await this.queryAll(this.rawDataTable.elem, '.raw-data-column'),
                async (elem) => {
                    const res = {
                        elem,
                        tplElem: await this.query(elem, '.raw-data-column__tpl'),
                        headerElem: await this.query(elem, '.raw-data-column__header'),
                        cellElems: await this.queryAll(elem, '.raw-data-column__cell'),
                    };

                    res.cells = await asyncMap(res.cellElems, (cellElem) => this.prop(cellElem, 'textContent'));

                    res.tplProperties = await asyncMap(
                        await this.queryAll(res.tplElem, '.raw-data-column__tpl-prop'),
                        (propElem) => this.prop(propElem, 'textContent'),
                    );
                    res.title = await this.prop(res.headerElem, 'textContent');

                    return res;
                },
            );

            if (!this.columns.length) {
                this.columns = null;
            }
        }

        this.uploadCollapsed = await this.hasClass(this.uploadFormBrowser.elem, 'upload-form__collapsed');
        this.fileName = await this.prop(this.fileNameElem.elem, 'value');
        this.useServerAddress = await this.prop(this.useServerCheck.elem, 'checked');
        this.serverAddress = await this.prop(this.serverAddressInput.elem, 'value');
        this.encode = await this.prop(this.isEncodeCheck.elem, 'checked');
        this.uploadFilename = (this.useServerAddress) ? this.serverAddress : this.fileName;

        this.templateSel.value = await this.prop(this.templateSel.elem, 'value');
        this.tplNameInp.value = await this.prop(this.tplNameInp.elem, 'value');
        this.initialAccount.value = await this.prop(this.initialAccount.elem, 'value');

        this.tplVisible = await this.isVisible(this.templateBlock.elem, true);
        if (this.isLoading) {
            this.state = LOADING_STATE;
        } else if (this.tplVisible) {
            const lblVisible = await this.isVisible(this.tplStateLbl.elem, true);
            if (lblVisible) {
                const stateLabel = await this.prop(this.tplStateLbl.elem, 'textContent');
                this.state = (stateLabel === 'Create template') ? CREATE_TPL_STATE : UPDATE_TPL_STATE;
            } else {
                this.state = RAW_DATA_STATE;
            }
        } else {
            this.state = BROWSE_FILE_STATE;
        }

        this.delete_warning = await WarningPopup.create(this, await this.query('#tpl_delete_warning'));

        this.model = await this.buildModel(this);
    }

    async buildModel(cont) {
        const res = {};

        res.state = cont.state;
        res.isTplLoading = cont.isTplLoading;

        res.uploadCollapsed = cont.uploadCollapsed;
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

        if (res.template) {
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
        if (!res.initialAccount) {
            throw new Error('Initial account not found');
        }

        return res;
    }

    getColumn(data, index) {
        const rowsToShow = 2;
        const headerRow = data.slice(0, 1)[0];
        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 0 || ind > headerRow.length) {
            throw new Error(`Invalid column index: ${index}`);
        }

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
        const res = {
            visibility: {
                uploadFormBrowser: true,
                isEncodeCheck: true,
                serverAddressBlock: model.useServerAddress,
            },
            values: {
                columns: null,
                initialAccount: model.initialAccount.id.toString(),
            },
        };

        res.values.fileName = model.uploadFilename;

        if (model.state === CREATE_TPL_STATE
            || model.state === UPDATE_TPL_STATE) {
            if (model.state === UPDATE_TPL_STATE && !model.template) {
                throw new Error('Invalid model: expected template');
            }

            setParam(res.visibility, {
                templateBlock: true,
                loadingIndicator: false,
                tplField: false,
                nameField: true,
                columnField: true,
                rawDataTable: true,
                updateTplBtn: false,
                deleteTplBtn: false,
                submitTplBtn: true,
                tplFeedback: true,
            });

            res.visibility.cancelTplBtn = (model.state === CREATE_TPL_STATE)
                ? (App.state.templates.data.length > 0)
                : true;

            res.values.tplNameInp = (model.template) ? model.template.name : '';
        } else if (model.state === RAW_DATA_STATE) {
            setParam(res.visibility, {
                templateBlock: true,
                loadingIndicator: false,
                tplField: true,
                nameField: false,
                columnField: false,
                rawDataTable: false,
                updateTplBtn: true,
                deleteTplBtn: true,
                submitTplBtn: false,
                cancelTplBtn: false,
                tplFeedback: true,
            });
        } else if (model.state === LOADING_STATE) {
            setParam(res.visibility, {
                templateBlock: true,
                loadingIndicator: true,
                nameField: false,
                columnField: false,
                rawDataTable: false,
                updateTplBtn: true,
                deleteTplBtn: true,
                submitTplBtn: false,
                cancelTplBtn: false,
                tplFeedback: false,
            });
        } else if (model.state === BROWSE_FILE_STATE) {
            setParam(res.visibility, {
                templateBlock: false,
                loadingIndicator: false,
                nameField: false,
                columnField: false,
                rawDataTable: false,
                updateTplBtn: false,
                deleteTplBtn: false,
                submitTplBtn: false,
                cancelTplBtn: false,
                tplFeedback: false,
            });
        }

        if ([CREATE_TPL_STATE, UPDATE_TPL_STATE, RAW_DATA_STATE].includes(model.state)) {
            const rawDataHeader = this.parent.fileData.slice(0, 1)[0];
            res.values.columns = rawDataHeader.map(
                (item, ind) => this.getColumn(this.parent.fileData, ind),
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
            if (propValue < 1 || propValue > this.columns.length) {
                return false;
            }

            if (property === 'accountAmount' || property === 'transactionAmount') {
                const val = this.columns[propValue - 1].cells[0];
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
        await this.click(this.closeBtn);
    }

    async toggleServerAddress() {
        await this.click(this.useServerCheck.elem);
        await this.parse();
    }

    async setFile(filename) {
        if (typeof filename !== 'string') {
            throw new Error('Invalid parameter');
        }

        if (!this.useServerAddress) {
            await this.toggleServerAddress();
        }

        this.model.filename = filename;
        this.expectedState = this.getExpectedState(this.model);

        await this.input(this.serverAddressInput.elem, filename);
        await this.parse();

        return this.checkState();
    }

    async upload() {
        await this.parse();

        const tplVisible = await this.isVisible(this.templateBlock.elem, true);
        if (App.state.templates.length > 0) {
            this.model.state = RAW_DATA_STATE;
        } else {
            this.model.state = CREATE_TPL_STATE;
        }
        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.serverUploadBtn.elem);
        // Template block is visible if file was already uploaded
        if (!tplVisible) {
            await this.wait('#templateBlock', { visible: true });
        }
        await this.wait('#loadingIndicator', { hidden: true });
        await this.parse();

        return this.checkState();
    }

    async selectTemplateById(val) {
        if (this.model.state !== RAW_DATA_STATE) {
            throw new Error('Invalid state');
        }

        this.model.template = App.state.templates.getItem(val);
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.templateSel.elem, val.toString());
        await this.onChange(this.templateSel.elem);
        await this.parse();

        return this.checkState();
    }

    async selectTemplateByIndex(val) {
        const itemId = App.state.templates.indexToId(val);
        return this.selectTemplateById(itemId);
    }

    async createTemplate() {
        if (this.model.state !== RAW_DATA_STATE) {
            throw new Error('Invalid state');
        }

        this.model.state = CREATE_TPL_STATE;
        this.model.template = null;
        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.createTplBtn.elem);
        await this.parse();

        return this.checkState();
    }

    async updateTemplate() {
        if (this.model.state !== RAW_DATA_STATE) {
            throw new Error('Invalid state');
        }

        this.model.state = UPDATE_TPL_STATE;
        this.model.template = App.state.templates.getItem(this.templateSel.value);
        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.updateTplBtn.elem);
        await this.parse();

        return this.checkState();
    }

    async deleteTemplate() {
        if (this.model.state !== RAW_DATA_STATE) {
            throw new Error('Invalid state');
        }

        if (this.templateSel.options.length === 1) {
            this.model.state = CREATE_TPL_STATE;
            this.model.template = null;
        } else {
            this.model.state = RAW_DATA_STATE;
            const currentInd = this.templateSel.options.findIndex(
                (option) => option.value === this.templateSel.value,
            );
            const newInd = (currentInd > 0) ? 0 : 1;
            const newTplId = this.templateSel.options[newInd].value;
            this.model.template = App.state.templates.getItem(newTplId);
        }

        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.deleteTplBtn.elem);
        await this.parse();

        if (!await Component.isVisible(this.delete_warning)) {
            throw new Error('Delete template warning popup not appear');
        }
        if (!this.delete_warning.okBtn) {
            throw new Error('OK button not found');
        }

        await this.click(this.delete_warning.okBtn);
        await this.waitForFunction(async () => {
            await this.parse();
            return !this.isTplLoading;
        });

        return this.checkState();
    }

    async inputTemplateName(val) {
        if (this.model.state !== CREATE_TPL_STATE && this.model.state !== UPDATE_TPL_STATE) {
            throw new Error('Invalid state');
        }

        this.model.template.name = val;
        this.expectedState = this.getExpectedState(this.model);

        await this.input(this.tplNameInp.elem, val);
        await this.parse();

        return this.checkState();
    }

    async selectTemplateColumn(name, index) {
        if (this.model.state !== CREATE_TPL_STATE && this.model.state !== UPDATE_TPL_STATE) {
            throw new Error('Invalid state');
        }

        this.model.template.columns[name] = index;
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.columnSel.elem, name.toString());
        await this.onChange(this.columnSel.elem);
        await this.parse();

        const ind = parseInt(index, 10);
        if (Number.isNaN(ind) || ind < 1 || ind > this.columns.length) {
            throw new Error(`Invalid index: ${index}`);
        }
        await this.click(this.columns[ind - 1].elem);
        await this.parse();

        return this.checkState();
    }

    async submitTemplate() {
        const disabled = await this.prop(this.submitTplBtn.elem, 'disabled');
        if (disabled) {
            throw new Error('Submit template button is disabled');
        }

        const isValid = this.isValidTemplate(this.model.template);
        if (isValid) {
            this.model.state = RAW_DATA_STATE;
        }
        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.submitTplBtn.elem);
        await this.waitForFunction(async () => {
            await this.parse();
            return !this.isTplLoading;
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
        const visible = await this.isVisible(this.cancelTplBtn.elem, true);
        const disabled = await this.prop(this.cancelTplBtn.elem, 'disabled');
        if (!visible || disabled) {
            throw new Error('Cancel template button is invisible or disabled');
        }

        this.model.state = RAW_DATA_STATE;
        this.expectedState = this.getExpectedState(this.model);

        await this.click(this.cancelTplBtn.elem);
        await this.parse();

        return this.checkState();
    }

    async selectAccount(val) {
        this.model.initialAccount = App.state.accounts.getItem(val);
        this.expectedState = this.getExpectedState(this.model);

        await this.selectByValue(this.initialAccount.elem, val.toString());
        await this.onChange(this.initialAccount.elem);
        await this.parse();

        return this.checkState();
    }

    async selectEncoding(val) {
        if (this.encode === !!val) {
            return;
        }

        await this.click(this.isEncodeCheck.elem);
        await this.parse();
    }

    async submit() {
        await this.click(this.submitBtn.elem);
        await this.parse();
    }
}
