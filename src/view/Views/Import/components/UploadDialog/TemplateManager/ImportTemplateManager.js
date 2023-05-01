import {
    ge,
    isFunction,
    copyObject,
    show,
    enable,
    Component,
    re,
    setEvents,
    insertAfter,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { Button } from 'jezvejs/Button';
import { Switch } from 'jezvejs/Switch';
import { __ } from '../../../../../utils/utils.js';
import { API } from '../../../../../API/index.js';
import { ImportTemplateError } from '../../../../../Models/Error/ImportTemplateError.js';
import { ImportTemplate } from '../../../../../Models/ImportTemplate.js';
import { ConfirmDialog } from '../../../../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../../../Components/LoadingIndicator/LoadingIndicator.js';
import { RawDataTable } from '../RawDataTable/RawDataTable.js';
import { TemplateSelect } from '../TemplateSelect/TemplateSelect.js';
import './ImportTemplateManager.scss';

/** CSS classes */
const VALID_FEEDBACK_CLASS = 'valid-feedback';
const INVALID_FEEDBACK_CLASS = 'invalid-feedback';

/** States */
export const LOADING_STATE = 1;
export const TPL_SELECT_STATE = 2;
export const TPL_CREATE_STATE = 3;
export const TPL_UPDATE_STATE = 4;

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
            templates: window.app.model.templates.data,
            template: null,
            selectedTemplateId: 0,
            validation: {
                name: true,
                firstRow: true,
                valid: true,
            },
        };

        this.columnFeedback = {
            accountAmount: { msg: __('MSG_TPL_ACCOUNT_AMOUNT') },
            accountCurrency: { msg: __('MSG_TPL_ACCOUNT_CURRENCY') },
            transactionAmount: { msg: __('MSG_TPL_TR_AMOUNT') },
            transactionCurrency: { msg: __('MSG_TPL_TR_CURRENCY') },
            date: { msg: __('MSG_TPL_DATE') },
            comment: { msg: __('MSG_TPL_COMMENT') },
        };

        const elemIds = [
            'tplSelectGroup',
            'templateForm',
            'tplFilename',
            'tplField',
            'tplFieldHeader',
            'tplFeedback',
            'nameField',
            'tplNameInp',
            'firstRowField',
            'firstRowInp',
            'decFirstRowBtn',
            'incFirstRowBtn',
            'tplAccountSwitchField',
            'tplAccountSwitch',
            'tplAccountField',
            'columnField',
            'tplControls',
            'submitTplBtn',
            'cancelTplBtn',
            'rawDataTable',
            'tplFormFeedback',
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

        this.templateSelect = TemplateSelect.create({
            onChange: (tpl) => this.onTemplateChange(tpl),
            onUpdate: () => this.onUpdateTemplate(),
            onDelete: () => this.onDeleteTemplate(),
        });
        insertAfter(this.templateSelect.elem, this.tplFieldHeader);

        this.createTplBtn = Button.create({
            id: 'createTplBtn',
            className: 'create-btn',
            icon: 'plus',
            onClick: () => this.onCreateTemplateClick(),
        });
        this.tplFieldHeader.append(this.createTplBtn.elem);

        this.columnDropDown = DropDown.create({
            elem: 'columnSel',
        });

        // Main account
        this.accountDropDown = DropDown.create({
            elem: 'initialAccount',
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (account) => this.onAccountChange(account),
        });
        window.app.initAccountsList(this.accountDropDown);
        this.accountDropDown.setSelection(this.state.mainAccount.id);

        // Template default account
        this.tplAccountSwitch = Switch.fromElement(this.tplAccountSwitch, {
            onChange: () => this.onTemplateAccountToggle(),
        });

        this.tplAccountDropDown = DropDown.create({
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (account) => this.onTemplateAccountChange(account),
        });
        window.app.initAccountsList(this.tplAccountDropDown);
        this.tplAccountField.append(this.tplAccountDropDown.elem);

        setEvents(this.submitUploadedBtn, { click: () => this.onSubmit() });

        setEvents(this.tplNameInp, { input: () => this.onTemplateNameInput() });
        setEvents(this.firstRowInp, { input: () => this.onFirstRowInput() });
        DecimalInput.create({
            elem: this.firstRowInp,
            digits: 0,
            allowNegative: false,
        });
        setEvents(this.decFirstRowBtn, { click: () => this.onFirstRowDecrease() });
        setEvents(this.incFirstRowBtn, { click: () => this.onFirstRowIncrease() });

        setEvents(this.submitTplBtn, { click: () => this.onSubmitTemplateClick() });
        setEvents(this.cancelTplBtn, { click: () => this.onCancelTemplateClick() });

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
        this.setState({
            ...this.state,
            id: LOADING_STATE,
            rawData: null,
            filename: null,
            rowsToShow: 3,
            listLoading: false,
            template: null,
            selectedTemplateId: 0,
        });

        this.hide();
    }

    /** Show/hide loading indication */
    setLoading() {
        this.setState({ ...this.state, id: LOADING_STATE });
    }

    /** Copy specified data to component */
    setRawData(data, filename) {
        this.setState({
            ...this.state,
            rawData: copyObject(data),
            filename,
        });

        if (window.app.model.templates.length === 0) {
            this.setCreateTemplateState();
            return;
        }

        let template = this.findValidTemplate(this.state.rawData);
        if (!template) {
            [template] = this.state.templates;
            if (!template) {
                throw new Error('Invalid selection');
            }
        }

        this.setTemplate(template.id);
        this.setState({
            ...this.state,
            selectedTemplateId: template.id,
        });
        this.setSelectTemplateState();
    }

    /** Main account update handler */
    setMainAccount(mainAccount) {
        if (!mainAccount) {
            throw new Error('Invalid account');
        }

        this.setState({
            ...this.state,
            mainAccount,
        });
    }

    /** Initial account select 'change' event handler */
    onAccountChange(selectedAccount) {
        return this.changeMainAccount(selectedAccount?.id);
    }

    changeMainAccount(id) {
        if (this.state.mainAccount.id === id) {
            return;
        }
        const mainAccount = window.app.model.accounts.getItem(id);
        if (!mainAccount) {
            throw new Error('Account not found');
        }

        this.setState({
            ...this.state,
            mainAccount,
        });

        if (isFunction(this.props.onAccountChange)) {
            this.props.onAccountChange(mainAccount.id);
        }
    }

    /** Import template select 'change' event handler */
    onTemplateChange(selectedTemplate) {
        if (this.state.id !== TPL_SELECT_STATE) {
            return;
        }

        if (!selectedTemplate) {
            throw new Error('Invalid selection');
        }

        this.setTemplate(selectedTemplate.id);

        this.setState({
            ...this.state,
            selectedTemplateId: selectedTemplate.id,
        });
    }

    /**
     * Set specified template
     * @param {number} value - import template id
     */
    setTemplate(value) {
        const template = window.app.model.templates.getItem(value) ?? null;
        if (this.state.template?.id === template?.id) {
            return;
        }

        if (template?.account_id) {
            this.changeMainAccount(template.account_id);
        }

        this.setState({
            ...this.state,
            template,
        });
    }

    /** Template name field 'input' event handler */
    onTemplateNameInput() {
        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...this.state.template,
                name: this.tplNameInp.value,
            }),
            validation: {
                ...this.state.validation,
                name: true,
            },
        });
    }

    /** Template first row 'input' event handler */
    onFirstRowInput() {
        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...this.state.template,
                first_row: parseInt(this.firstRowInp.value, 10),
            }),
            validation: {
                ...this.state.validation,
                firstRow: true,
            },
        });
    }

    /** Template first row decrease button 'click' event handler */
    onFirstRowDecrease() {
        const { template } = this.state;
        if (Number.isNaN(template.first_row) || template.first_row === 1) {
            return;
        }

        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...template,
                first_row: template.first_row - 1,
            }),
            validation: {
                ...this.state.validation,
                firstRow: true,
            },
        });
    }

    /** Template first row increase button 'click' event handler */
    onFirstRowIncrease() {
        const { template } = this.state;

        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...template,
                first_row: (
                    Number.isNaN(template.first_row) ? 1 : template.first_row + 1
                ),
            }),
            validation: {
                ...this.state.validation,
                firstRow: true,
            },
        });
    }

    /** Template default account 'change' event handler */
    onTemplateAccountToggle() {
        const { template } = this.state;
        const { userAccounts } = window.app.model;

        let id = 0;
        if (!template.account_id) {
            const account = userAccounts.getItemByIndex(0);
            id = account.id;
        }

        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...template,
                account_id: id,
            }),
        });
    }

    /** Template default account 'change' event handler */
    onTemplateAccountChange(account) {
        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...this.state.template,
                account_id: account?.id,
            }),
        });
    }

    /** Create template button 'click' event handler */
    onCreateTemplateClick() {
        this.setCreateTemplateState();
    }

    /** Set select template state */
    setSelectTemplateState() {
        this.setState({
            ...this.state,
            id: TPL_SELECT_STATE,
        });
        this.notifyStateChanged();
    }

    /** Set create template state */
    setCreateTemplateState() {
        this.setState({
            ...this.state,
            id: TPL_CREATE_STATE,
            template: new ImportTemplate({
                name: '',
                type_id: 0,
                account_id: 0,
                first_row: 2,
                columns: {},
            }),
        });
        this.notifyStateChanged();
    }

    /** Update template button 'click' event handler */
    onUpdateTemplate() {
        this.setState({
            ...this.state,
            id: TPL_UPDATE_STATE,
        });
        this.notifyStateChanged();
    }

    /** Notifyes template form state changed */
    notifyStateChanged() {
        if (!isFunction(this.props.onChangeState)) {
            return;
        }

        this.props.onChangeState(this.state.id);
    }

    /** Delete template button 'click' event handler */
    onDeleteTemplate() {
        ConfirmDialog.create({
            id: 'tpl_delete_warning',
            title: __('TEMPLATE_DELETE'),
            content: __('MSG_TEMPLATE_DELETE'),
            onConfirm: () => this.requestDeleteTemplate(this.state.template.id),
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
            this.setState({
                ...this.state,
                validation: {
                    ...this.state.validation,
                    name: false,
                    valid: false,
                },
            });

            return;
        }

        const firstRow = parseInt(template.first_row, 10);
        if (Number.isNaN(firstRow) || firstRow < 1) {
            this.setState({
                ...this.state,
                validation: {
                    ...this.state.validation,
                    firstRow: false,
                    valid: false,
                },
            });

            return;
        }

        if (template.id) {
            requestObj.id = template.id;
        }

        this.requestSubmitTemplate(requestObj);
    }

    startListLoading() {
        this.setState({ ...this.state, listLoading: true });
    }

    stopListLoading() {
        this.setState({ ...this.state, listLoading: false });
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                importtemplates: {},
                importrules: {},
            },
        };
    }

    getListDataFromResponse(response) {
        const state = response?.data?.state;
        return {
            templates: state?.importtemplates?.data,
            rules: state?.importrules?.data,
        };
    }

    setListData(templatesData, rulesData) {
        const { templates } = window.app.model;
        templates.setData(templatesData);
        this.setState({
            ...this.state,
            templates: templates.data,
        });

        if (window.app.model.templates.length > 0) {
            // Find template with same name as currently selected
            let template = null;
            if (this.state.template) {
                template = templates.find((item) => item.name === this.state.template.name);
            }
            if (!template) {
                template = templates.getItemByIndex(0);
            }
            this.setTemplate(template.id);
            this.setState({
                ...this.state,
                selectedTemplateId: template.id,
            });
            this.setSelectTemplateState();
        } else {
            this.setCreateTemplateState();
        }

        if (rulesData) {
            window.app.model.rules.setData(rulesData);
        }

        this.stopListLoading();

        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate();
        }
    }

    /** Send API request to create/update template */
    async requestSubmitTemplate(data) {
        this.startListLoading();

        try {
            const request = this.prepareRequest(data);
            const response = (data.id)
                ? await API.importTemplate.update(request)
                : await API.importTemplate.create(request);

            const { templates, rules } = this.getListDataFromResponse(response);
            this.setListData(templates, rules);
        } catch (e) {
            window.app.createErrorNotification(e.message);
        }
    }

    /** Send API request to delete template */
    async requestDeleteTemplate(id) {
        this.startListLoading();

        try {
            const request = this.prepareRequest({ id });
            const response = await API.importTemplate.del(request);
            const { templates, rules } = this.getListDataFromResponse(response);
            this.setListData(templates, rules);
        } catch (e) {
            window.app.createErrorNotification(e.message);
            this.stopListLoading();
        }
    }

    /** Send API request to obain list of import templates */
    async requestTemplatesList() {
        try {
            const result = await API.importTemplate.list();
            this.setListData(result.data);
        } catch (e) {
            window.app.createErrorNotification(e.message);
            this.stopListLoading();
        }
    }

    /** Cancel template button 'click' event handler */
    onCancelTemplateClick() {
        if (this.state.id !== TPL_CREATE_STATE && this.state.id !== TPL_UPDATE_STATE) {
            return;
        }

        this.setSelectTemplateState();
        // Restore previously selected template
        this.setTemplate(this.state.selectedTemplateId);
    }

    /** Raw data table column 'click' event handler */
    onDataColumnClick(index) {
        if (this.state.id !== TPL_CREATE_STATE && this.state.id !== TPL_UPDATE_STATE) {
            return;
        }

        const selectedColumn = this.columnDropDown.getSelectionData();
        if (!selectedColumn) {
            throw new Error('Invalid column selection');
        }

        const { template } = this.state;
        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...template,
                columns: {
                    ...template.columns,
                    [selectedColumn.id]: index + 1,
                },
            }),
        });
    }

    /** Set feedback for specified element */
    setFeedback(feedbackElem, message = null, isValid = false) {
        const elem = feedbackElem;
        if (!elem) {
            throw new Error('Invalid element');
        }

        if (typeof message !== 'string' || message.length === 0) {
            elem.textContent = '';
            show(elem, false);
            return;
        }

        elem.textContent = message;

        elem.classList.toggle(VALID_FEEDBACK_CLASS, isValid);
        elem.classList.toggle(INVALID_FEEDBACK_CLASS, !isValid);

        show(elem, true);
    }

    /** Renders selected template feedback */
    setTemplateFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback, message, isValid);
        this.setFeedback(this.tplFormFeedback);
        this.setFeedback(this.convertFeedback);
    }

    /** Renders template form feedback */
    setTemplateFormFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback);
        this.setFeedback(this.tplFormFeedback, message, isValid);
        this.setFeedback(this.convertFeedback);
    }

    /** Validate current template on raw data */
    setConvertFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback);
        this.setFeedback(this.tplFormFeedback);
        this.setFeedback(this.convertFeedback, message, isValid);
    }

    /** Validate current template on raw data */
    onInvalidPropertyValue(state, propName) {
        if (!state) {
            throw new Error('Invalid state');
        }
        if (
            typeof propName !== 'string'
            || !propName.length
            || !this.columnFeedback[propName]
        ) {
            throw new Error('Invalid property');
        }

        if (state.id !== TPL_CREATE_STATE && state.id !== TPL_UPDATE_STATE) {
            return;
        }

        this.setTemplateFormFeedback(this.columnFeedback[propName].msg, false);
        this.columnDropDown.setSelection(propName);
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
        let currency = window.app.model.currency.findByCode(value);
        if (!currency) {
            return { valid: false, column: 'accountCurrency' };
        }
        // Transaction currency
        value = template.getProperty('transactionCurrency', data, true);
        currency = window.app.model.currency.findByCode(value);
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

    /** Render import template select element according to the data in model */
    renderTemplateSelect(state, prevState) {
        if (
            state.selectedTemplateId === prevState?.selectedTemplateId
            && state.templates === prevState?.templates
        ) {
            return;
        }

        const template = window.app.model.templates.getItem(state.selectedTemplateId);
        this.templateSelect.setState((tplState) => ({
            ...tplState,
            template,
            templates: state.templates,
        }));
    }

    /** Render component */
    render(state, prevState = {}) {
        this.renderTemplateSelect(state, prevState);

        const templateAvail = (window.app.model.templates.length > 0);
        if (state.id === LOADING_STATE) {
            this.loadingIndicator.show();
            show(this.convertFeedback, false);
        } else if (state.id === TPL_SELECT_STATE) {
            show(this.tplField, templateAvail);
            show(this.noTplLabel, !templateAvail);

            this.loadingIndicator.hide();
            window.app.setValidation(this.nameField, true);
            this.createTplBtn.show(templateAvail);
        } else if (state.id === TPL_CREATE_STATE || state.id === TPL_UPDATE_STATE) {
            show(this.noTplLabel, false);
            this.loadingIndicator.hide();
            show(this.tplField, false);
            this.createTplBtn.show(false);
            show(this.cancelTplBtn, templateAvail);
        }

        const isRawData = (state.id === TPL_SELECT_STATE);
        const isForm = (state.id === TPL_CREATE_STATE || state.id === TPL_UPDATE_STATE);
        show(this.tplSelectGroup, isRawData);
        show(this.templateForm, isForm);

        this.templateSelect.enable(!state.listLoading);
        this.columnDropDown.enable(!state.listLoading);
        enable(this.tplNameInp, !state.listLoading);
        this.createTplBtn.enable(!state.listLoading);
        enable(this.submitTplBtn, !state.listLoading);
        enable(this.cancelTplBtn, !state.listLoading);

        this.tplFilename.textContent = state.filename ?? '';

        this.tplNameInp.value = (state.template) ? state.template.name : '';

        // Raw data table
        if (!Array.isArray(state.rawData) || !state.rawData.length) {
            return;
        }

        const scrollLeft = (isForm && this.dataTable)
            ? this.dataTable.scrollLeft
            : 0;

        if (isForm) {
            const dataTable = RawDataTable.create({
                data: state.rawData,
                rowsToShow: state.rowsToShow,
                template: state.template,
                scrollLeft,
                onSelectColumn: (index) => this.onDataColumnClick(index),
            });

            this.rawDataTable.append(dataTable.elem);
            dataTable.scrollLeft = scrollLeft;

            re(this.dataTable?.elem);
            this.dataTable = dataTable;

            window.app.setValidation(this.nameField, state.validation.name);

            this.firstRowInp.value = state.template.first_row;
            enable(this.decFirstRowBtn, state.template.first_row > 1);
            window.app.setValidation(this.firstRowField, state.validation.firstRow);

            const useTplAccount = state.template.account_id !== 0;
            this.tplAccountSwitch.check(useTplAccount);
            show(this.tplAccountField, useTplAccount);
            if (state.template.account_id !== 0) {
                this.tplAccountDropDown.setSelection(state.template.account_id);
            }
        } else {
            re(this.dataTable?.elem);
        }

        let isValid = false;
        if (state.id === LOADING_STATE) {
            this.setTemplateFeedback();
        } else {
            const validateResult = this.validateTemplate(state.template, state.rawData);
            isValid = validateResult.valid;
            if (isValid) {
                enable(this.submitTplBtn, true);
                if (state.id === TPL_SELECT_STATE) {
                    this.setTemplateFeedback(__('TEMPLATE_VALID'), true);
                } else {
                    this.setTemplateFormFeedback(__('TEMPLATE_VALID'), true);
                }
            } else {
                this.onInvalidPropertyValue(state, validateResult.column);
                enable(this.submitTplBtn, false);
                if (state.id === TPL_SELECT_STATE) {
                    this.setTemplateFeedback(__('MSG_TPL_NOT_MATCH'), false);
                }
            }
        }

        const uploadEnabled = state.id === TPL_SELECT_STATE && isValid;
        this.accountDropDown.enable(uploadEnabled);
        this.accountDropDown.setSelection(state.mainAccount.id);
        show(this.initialAccField, uploadEnabled);
        enable(this.submitUploadedBtn, uploadEnabled);
        show(this.uploadControls, uploadEnabled);
    }
}
