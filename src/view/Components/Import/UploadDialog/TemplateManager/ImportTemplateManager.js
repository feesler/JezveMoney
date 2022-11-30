import {
    ge,
    isFunction,
    removeChilds,
    copyObject,
    show,
    enable,
    insertAfter,
    Component,
} from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { API } from '../../../../js/api/index.js';
import { ImportTemplateError } from '../../../../js/error/ImportTemplateError.js';
import { ImportTemplate } from '../../../../js/model/ImportTemplate.js';
import { ConfirmDialog } from '../../../ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../LoadingIndicator/LoadingIndicator.js';
import { RawDataTable } from '../RawDataTable/RawDataTable.js';
import './style.scss';

/** CSS classes */
const VALID_FEEDBACK_CLASS = 'valid-feedback';
const INVALID_FEEDBACK_CLASS = 'invalid-feedback';

/** Strings */
const TITLE_TEMPLATE = 'Template';
const TITLE_CREATE_TEMPLATE = 'Create template';
const TITLE_UPDATE_TEMPLATE = 'Update template';
const TITLE_TEMPLATE_DELETE = 'Delete import template';
const MSG_TEMPLATE_DELETE = 'Are you sure to delete this import template?';
const MSG_SEL_ACC_AMOUNT = 'Select decimal column for account amount';
const MSG_SEL_ACC_CURRENCY = 'Select correct column for account currency';
const MSG_SEL_TR_AMOUNT = 'Select decimal column for transaction amount';
const MSG_SEL_TR_CURRENCY = 'Select correct column for transaction currency';
const MSG_SEL_DATE = 'Select column for date';
const MSG_SEL_COMMENT = 'Select column for comment';
const MSG_TPL_LIST_REQUEST_FAIL = 'Fail to read list of import templates';
const MSG_RULES_LIST_REQUEST_FAIL = 'Fail to read list of import rules';
const MSG_VALID_TEMPLATE = 'Valid template';
const MSG_NOT_MATCHED_TEMPLATE = 'Template does not match data';
/** States */
const LOADING_STATE = 1;
const RAW_DATA_STATE = 2;
const TPL_UPDATE_STATE = 3;

/**
 * ImportTemplateManager component
 */
export class ImportTemplateManager extends Component {
    constructor(...args) {
        super(...args);

        if (!this.props?.mainAccount) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.state = {
            mainAccount: this.props.mainAccount,
        };

        this.columnFeedback = {
            accountAmount: { msg: MSG_SEL_ACC_AMOUNT },
            accountCurrency: { msg: MSG_SEL_ACC_CURRENCY },
            transactionAmount: { msg: MSG_SEL_TR_AMOUNT },
            transactionCurrency: { msg: MSG_SEL_TR_CURRENCY },
            date: { msg: MSG_SEL_DATE },
            comment: { msg: MSG_SEL_COMMENT },
        };

        this.templateDropDown = DropDown.create({
            elem: 'templateSel',
            className: 'dd_ellipsis',
            onchange: (tpl) => this.onTemplateChange(tpl),
        });
        this.columnDropDown = DropDown.create({
            elem: 'columnSel',
        });

        const elemIds = [
            'tplSelectGroup',
            'tplFormTop',
            'tplFormBottom',
            'tplHeading',
            'tplFilename',
            'tplStateLbl',
            'tplField',
            'nameField',
            'tplNameInp',
            'firstRowField',
            'firstRowInp',
            'decFirstRowBtn',
            'incFirstRowBtn',
            'tplAccountField',
            'createTplBtn',
            'updateTplBtn',
            'deleteTplBtn',
            'columnField',
            'tplControls',
            'submitTplBtn',
            'cancelTplBtn',
            'tableDescr',
            'rawDataTable',
            'tplFeedback',
            'initialAccField',
            'uploadControls',
            'submitUploadedBtn',
            'convertFeedback',
        ];
        elemIds.forEach((id) => {
            this[id] = ge(id);
            if (!this[id]) {
                throw new Error('Failed to initialize upload file dialog');
            }
        });

        // Main account
        this.accountDropDown = DropDown.create({
            elem: 'initialAccount',
            onchange: (account) => this.onAccountChange(account),
        });
        window.app.initAccountsList(this.accountDropDown);
        this.accountDropDown.selectItem(this.state.mainAccount.id.toString());

        // Template default account
        this.tplAccountCheck = Checkbox.fromElement(ge('tplAccountCheck'), {
            onChange: () => this.onTemplateAccountToggle(),
        });

        this.tplAccountDropDown = DropDown.create({
            onchange: (account) => this.onTemplateAccountChange(account),
        });
        window.app.initAccountsList(this.tplAccountDropDown);
        insertAfter(this.tplAccountDropDown.elem, this.tplAccountCheck.elem);

        this.submitUploadedBtn.addEventListener('click', () => this.onSubmit());

        this.tplNameInp.addEventListener('input', () => this.onTemplateNameInput());
        this.firstRowInp.addEventListener('input', () => this.onFirstRowInput());
        DecimalInput.create({
            elem: this.firstRowInp,
            digits: 0,
            allowNegative: false,
        });
        this.decFirstRowBtn.addEventListener('click', () => this.onFirstRowDecrease());
        this.incFirstRowBtn.addEventListener('click', () => this.onFirstRowIncrease());

        this.createTplBtn.addEventListener('click', () => this.onCreateTemplateClick());
        this.updateTplBtn.addEventListener('click', () => this.onUpdateTemplateClick());
        this.deleteTplBtn.addEventListener('click', () => this.onDeleteTemplateClick());
        this.submitTplBtn.addEventListener('click', () => this.onSubmitTemplateClick());
        this.cancelTplBtn.addEventListener('click', () => this.onCancelTemplateClick());

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);

        this.reset();
    }

    onSubmit() {
        if (isFunction(this.props.onSubmit)) {
            this.props.onSubmit();
        }
    }

    /** Apply currently selected template to raw data and return array of import data items */
    applyTemplate() {
        if (
            !this.state
            || !Array.isArray(this.state.rawData)
            || !this.state.template
        ) {
            throw new Error('Invalid state');
        }

        try {
            const res = this.state.template.applyTo(this.state.rawData, this.state.mainAccount);
            return res;
        } catch (e) {
            if (!(e instanceof ImportTemplateError)) {
                throw e;
            }

            this.setConvertFeedback(e.message, false);

            return null;
        }
    }

    /** Reset component state */
    reset() {
        const newState = {
            id: LOADING_STATE,
            rawData: null,
            filename: null,
            rowsToShow: 3,
            listLoading: false,
            mainAccount: this.state.mainAccount,
        };

        this.state = newState;
        this.render(this.state);
        this.hide();
    }

    /** Show/hide loading indication */
    setLoading() {
        this.state.id = LOADING_STATE;
        this.render(this.state);
    }

    /** Copy specified data to component */
    setRawData(data, filename) {
        this.state.rawData = copyObject(data);
        this.state.filename = filename;

        if (window.app.model.templates.length > 0) {
            this.state.id = RAW_DATA_STATE;

            let template = this.findValidTemplate(this.state.rawData);
            if (!template) {
                template = this.templateDropDown.getSelectionData();
                if (!template) {
                    throw new Error('Invalid selection');
                }
            }

            this.setTemplate(template.id);
        } else {
            this.setCreateTemplateState();
        }
    }

    /** Main account update handler */
    setMainAccount(account) {
        if (!account) {
            throw new Error('Invalid account');
        }

        this.state.mainAccount = account;
        this.accountDropDown.selectItem(account.id.toString());
    }

    /** Initial account select 'change' event handler */
    onAccountChange(selectedAccount) {
        return this.changeMainAccount(selectedAccount?.id);
    }

    changeMainAccount(id) {
        const account = window.app.model.accounts.getItem(id);
        if (!account) {
            throw new Error('Account not found');
        }

        this.state.mainAccount = account;

        if (isFunction(this.props.onAccountChange)) {
            this.props.onAccountChange(account.id);
        }

        this.render(this.state);
    }

    /** Import template select 'change' event handler */
    onTemplateChange(selectedTemplate) {
        if (this.state.id !== RAW_DATA_STATE) {
            return;
        }

        if (!selectedTemplate) {
            throw new Error('Invalid selection');
        }

        this.setTemplate(selectedTemplate.id);
    }

    /**
     * Set specified template
     * @param {number} value - import template id
     */
    setTemplate(value) {
        const template = window.app.model.templates.getItem(value);
        if (template) {
            this.state.template = new ImportTemplate(template);

            if (template.account_id) {
                this.changeMainAccount(template.account_id);
            }
        } else {
            this.state.template = null;
        }

        this.render(this.state);
    }

    /** Template name field 'input' event handler */
    onTemplateNameInput() {
        this.state.template.name = this.tplNameInp.value;

        window.app.clearBlockValidation(this.nameField);
    }

    /** Template first row 'input' event handler */
    onFirstRowInput() {
        this.state.template.first_row = parseInt(this.firstRowInp.value, 10);

        window.app.clearBlockValidation(this.firstRowField);
        this.render(this.state);
    }

    /** Template first row decrease button 'click' event handler */
    onFirstRowDecrease() {
        const { template } = this.state;
        if (Number.isNaN(template.first_row) || template.first_row === 1) {
            return;
        }

        this.state.template.first_row -= 1;

        window.app.clearBlockValidation(this.firstRowField);

        this.render(this.state);
    }

    /** Template first row increase button 'click' event handler */
    onFirstRowIncrease() {
        const { template } = this.state;

        if (Number.isNaN(template.first_row)) {
            this.state.template.first_row = 1;
        } else {
            this.state.template.first_row += 1;
        }

        window.app.clearBlockValidation(this.firstRowField);

        this.render(this.state);
    }

    /** Template default account 'change' event handler */
    onTemplateAccountToggle() {
        if (this.state.template.account_id) {
            this.state.template.account_id = 0;
        } else {
            const account = window.app.model.userAccounts.getItemByIndex(0);
            this.state.template.account_id = account.id;
        }

        this.render(this.state);
    }

    /** Template default account 'change' event handler */
    onTemplateAccountChange(account) {
        this.state.template.account_id = account?.id;

        this.render(this.state);
    }

    /** Create template button 'click' event handler */
    onCreateTemplateClick() {
        this.setCreateTemplateState();
    }

    /** Set create template state */
    setCreateTemplateState() {
        this.state.id = TPL_UPDATE_STATE;
        this.state.template = new ImportTemplate({
            name: '',
            type_id: 0,
            account_id: 0,
            first_row: 2,
            columns: {},
        });

        this.render(this.state);
    }

    /** Update template button 'click' event handler */
    onUpdateTemplateClick() {
        this.state.id = TPL_UPDATE_STATE;

        this.render(this.state);
    }

    /** Delete template button 'click' event handler */
    onDeleteTemplateClick() {
        ConfirmDialog.create({
            id: 'tpl_delete_warning',
            title: TITLE_TEMPLATE_DELETE,
            content: MSG_TEMPLATE_DELETE,
            onconfirm: () => this.requestDeleteTemplate(this.state.template.id),
        });
    }

    /** Save template button 'click' event handler */
    onSubmitTemplateClick() {
        const { template } = this.state;

        const requestObj = {
            name: template.name,
            type_id: template.type_id,
            account_id: template.account_id,
            first_row: template.first_row,
            date_col: template.columns.date,
            comment_col: template.columns.comment,
            trans_curr_col: template.columns.transactionCurrency,
            trans_amount_col: template.columns.transactionAmount,
            account_curr_col: template.columns.accountCurrency,
            account_amount_col: template.columns.accountAmount,
        };

        if (!template.name.length) {
            window.app.invalidateBlock(this.nameField);
            return;
        }

        const firstRow = parseInt(template.first_row, 10);
        if (Number.isNaN(firstRow) || firstRow < 1) {
            window.app.invalidateBlock(this.firstRowField);
            return;
        }

        if (template.id) {
            requestObj.id = template.id;
        }

        this.requestSubmitTemplate(requestObj);
    }

    /** Send API request to create/update template */
    async requestSubmitTemplate(data) {
        this.state.listLoading = true;
        this.render(this.state);

        try {
            if (data.id) {
                await API.importTemplate.update(data);
            } else {
                await API.importTemplate.create(data);
            }

            await this.requestTemplatesList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Send API request to delete template */
    async requestDeleteTemplate(id) {
        this.state.listLoading = true;
        this.render(this.state);

        try {
            await API.importTemplate.del(id);
            await this.requestTemplatesList();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Send API request to obain list of import templates */
    async requestTemplatesList() {
        try {
            const result = await API.importTemplate.list();
            if (!Array.isArray(result.data)) {
                const errorMessage = (result && 'msg' in result)
                    ? result.msg
                    : MSG_TPL_LIST_REQUEST_FAIL;
                throw new Error(errorMessage);
            }

            this.state.listLoading = false;
            window.app.model.templates.setData(result.data);
            if (window.app.model.templates.length > 0) {
                this.state.id = RAW_DATA_STATE;
                this.renderTemplateSelect();
            } else {
                this.setCreateTemplateState();
            }

            await this.requestRulesList();

            if (isFunction(this.props.onUpdate)) {
                this.props.onUpdate();
            }
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Send API request to obain list of import rules */
    async requestRulesList() {
        try {
            const result = await API.importRule.list({ extended: true });
            if (!Array.isArray(result.data)) {
                const errorMessage = (result && 'msg' in result)
                    ? result.msg
                    : MSG_RULES_LIST_REQUEST_FAIL;
                throw new Error(errorMessage);
            }

            window.app.model.rules.setData(result.data);
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Render import template select element according to the data in model */
    renderTemplateSelect() {
        let selectedTemplate = null;

        // Find template with same name as currently selected
        if (this.state.template) {
            selectedTemplate = window.app.model.templates
                .find((item) => item.name === this.state.template.name);
        }

        this.templateDropDown.removeAll();

        const templateItems = window.app.model.templates
            .map((item) => ({ id: item.id, title: item.name }));
        this.templateDropDown.append(templateItems);

        // Restore selection
        if (!selectedTemplate) {
            [selectedTemplate] = templateItems;
        }
        this.templateDropDown.selectItem(selectedTemplate.id);

        this.setTemplate(selectedTemplate.id);
    }

    /** Cancel template button 'click' event handler */
    onCancelTemplateClick() {
        if (this.state.id !== TPL_UPDATE_STATE) {
            return;
        }

        this.state.id = RAW_DATA_STATE;
        // Restore previously selected template
        const selectedTemplate = this.templateDropDown.getSelectionData();
        this.setTemplate(selectedTemplate.id);
    }

    /** Raw data table column 'click' event handler */
    onDataColumnClick(index) {
        if (this.state.id !== TPL_UPDATE_STATE) {
            return;
        }

        const selectedColumn = this.columnDropDown.getSelectionData();
        if (!selectedColumn) {
            throw new Error('Invalid column selection');
        }
        this.state.template.columns[selectedColumn.id] = index + 1;

        this.render(this.state);
    }

    /** Set feedback for specified element */
    setFeedback(feedbackElem, message = null, isValid = false) {
        const elem = feedbackElem;
        if (!elem) {
            throw new Error('Invalid element');
        }

        if (typeof message === 'string' && message.length) {
            elem.textContent = message;

            if (isValid) {
                elem.classList.add(VALID_FEEDBACK_CLASS);
                elem.classList.remove(INVALID_FEEDBACK_CLASS);
            } else {
                elem.classList.add(INVALID_FEEDBACK_CLASS);
                elem.classList.remove(VALID_FEEDBACK_CLASS);
            }

            show(elem, true);
        } else {
            elem.textContent = '';
            show(elem, false);
        }
    }

    /** Validate current template on raw data */
    setTemplateFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback, message, isValid);
        this.setFeedback(this.convertFeedback);
    }

    /** Validate current template on raw data */
    setConvertFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback);
        this.setFeedback(this.convertFeedback, message, isValid);
    }

    /** Validate current template on raw data */
    onInvalidPropertyValue(state, propName) {
        if (!state) {
            throw new Error('Invalid state');
        }
        if (typeof propName !== 'string'
            || !propName.length
            || !this.columnFeedback[propName]) {
            throw new Error('Invalid property');
        }

        if (state.id === TPL_UPDATE_STATE) {
            this.setTemplateFeedback(this.columnFeedback[propName].msg, false);
            this.columnDropDown.selectItem(propName);
        }

        return false;
    }

    /** Validate current template on raw data */
    validateTemplate(template, rawData) {
        if (!template) {
            throw new Error('Invalid template');
        }
        if (!Array.isArray(rawData)) {
            throw new Error('Invalid data');
        }

        const [data] = rawData.slice(1, 2);
        // Account amount
        let value = template.getProperty('accountAmount', data, true);
        if (!value) {
            return { valid: false, column: 'accountAmount' };
        }
        // Transaction amount
        value = template.getProperty('transactionAmount', data, true);
        if (!value) {
            return { valid: false, column: 'transactionAmount' };
        }
        // Account currency
        value = template.getProperty('accountCurrency', data, true);
        let currency = window.app.model.currency.findByName(value);
        if (!currency) {
            return { valid: false, column: 'accountCurrency' };
        }
        // Transaction currency
        value = template.getProperty('transactionCurrency', data, true);
        currency = window.app.model.currency.findByName(value);
        if (!currency) {
            return { valid: false, column: 'transactionCurrency' };
        }
        // Date
        value = template.getProperty('date', data, true);
        if (!value) {
            return { valid: false, column: 'date' };
        }
        // Comment
        value = template.getProperty('comment', data, true);
        if (!value) {
            return { valid: false, column: 'comment' };
        }

        return { valid: true };
    }

    /** Find valid template for data */
    findValidTemplate(rawData) {
        return window.app.model.templates.find((template) => {
            const { valid } = this.validateTemplate(template, rawData);
            return valid;
        });
    }

    /** Render component */
    render(state) {
        const templateAvail = (window.app.model.templates.length > 0);
        if (state.id === LOADING_STATE) {
            this.loadingIndicator.show();
            show(this.convertFeedback, false);
        } else if (state.id === RAW_DATA_STATE) {
            show(this.tplField, templateAvail);
            show(this.noTplLabel, !templateAvail);
            show(this.tplHeading, true);
            this.tplStateLbl.textContent = TITLE_TEMPLATE;

            this.loadingIndicator.hide();
            window.app.clearBlockValidation(this.nameField);
            show(this.createTplBtn, templateAvail);
            show(this.updateTplBtn, !!state.template);
            show(this.deleteTplBtn, !!state.template);
        } else if (state.id === TPL_UPDATE_STATE) {
            this.tplStateLbl.textContent = (state.template && state.template.id)
                ? TITLE_UPDATE_TEMPLATE
                : TITLE_CREATE_TEMPLATE;

            show(this.noTplLabel, false);
            show(this.tplHeading, true);
            this.loadingIndicator.hide();
            show(this.tplField, false);
            show(this.createTplBtn, false);
            show(this.updateTplBtn, false);
            show(this.deleteTplBtn, false);
            show(this.cancelTplBtn, templateAvail);
        }

        const isRawData = (state.id === RAW_DATA_STATE);
        const isForm = (state.id === TPL_UPDATE_STATE);
        show(this.tplSelectGroup, isRawData);
        show(this.rawDataTable, isForm);
        show(this.tableDescr, isForm);
        show(this.tplFormTop, isForm);
        show(this.tplFormBottom, isForm);
        show(this.nameField, isForm);
        show(this.tplAccountField, isForm);
        show(this.columnField, isForm);
        show(this.firstRowField, isForm);
        show(this.tplControls, isForm);

        this.templateDropDown.enable(!state.listLoading);
        this.columnDropDown.enable(!state.listLoading);
        enable(this.tplNameInp, !state.listLoading);
        enable(this.createTplBtn, !state.listLoading);
        enable(this.updateTplBtn, !state.listLoading);
        enable(this.deleteTplBtn, !state.listLoading);
        enable(this.submitTplBtn, !state.listLoading);
        enable(this.cancelTplBtn, !state.listLoading);

        this.tplFilename.textContent = state.filename ?? '';

        this.tplNameInp.value = (state.template) ? state.template.name : '';

        // Raw data table
        if (!Array.isArray(state.rawData) || !state.rawData.length) {
            return;
        }

        const scrollLeft = (state.id === TPL_UPDATE_STATE && this.dataTable)
            ? this.dataTable.scrollLeft
            : 0;

        removeChilds(this.rawDataTable);
        if (state.id === TPL_UPDATE_STATE) {
            this.dataTable = RawDataTable.create({
                data: state.rawData,
                rowsToShow: state.rowsToShow,
                template: state.template,
                scrollLeft,
                onSelectColumn: (index) => this.onDataColumnClick(index),
            });

            this.rawDataTable.append(this.dataTable.elem);
            this.dataTable.scrollLeft = scrollLeft;

            this.firstRowInp.value = state.template.first_row;
            enable(this.decFirstRowBtn, state.template.first_row > 1);

            const useTplAccount = state.template.account_id !== 0;
            this.tplAccountCheck.check(useTplAccount);
            this.tplAccountDropDown.show(useTplAccount);
            if (state.template.account_id !== 0) {
                this.tplAccountDropDown.selectItem(state.template.account_id);
            }
        }

        let isValid = false;
        if (state.id === LOADING_STATE) {
            this.setTemplateFeedback();
        } else {
            if (state.template.id) {
                this.templateDropDown.selectItem(state.template.id);
            }

            const validateResult = this.validateTemplate(state.template, state.rawData);
            isValid = validateResult.valid;
            if (isValid) {
                enable(this.submitTplBtn, true);
                this.setTemplateFeedback(MSG_VALID_TEMPLATE, true);
            } else {
                this.onInvalidPropertyValue(state, validateResult.column);
                enable(this.submitTplBtn, false);
                if (state.id === RAW_DATA_STATE) {
                    this.setTemplateFeedback(MSG_NOT_MATCHED_TEMPLATE, false);
                }
            }
        }

        const uploadEnabled = state.id === RAW_DATA_STATE && isValid;
        this.accountDropDown.enable(uploadEnabled);
        this.accountDropDown.selectItem(state.mainAccount.id);
        show(this.initialAccField, uploadEnabled);
        enable(this.submitUploadedBtn, uploadEnabled);
        show(this.controlsBlock, uploadEnabled);
    }
}
