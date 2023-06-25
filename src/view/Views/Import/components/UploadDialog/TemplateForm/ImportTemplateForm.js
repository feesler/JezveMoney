import {
    ge,
    isFunction,
    show,
    enable,
    Component,
    re,
    setEvents,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { Switch } from 'jezvejs/Switch';

import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

import { ImportTemplate, templateColumns } from '../../../../../Models/ImportTemplate.js';

import { DateFormatSelect } from '../../../../../Components/Inputs/Date/DateFormatSelect/DateFormatSelect.js';
import { InputField } from '../../../../../Components/Fields/InputField/InputField.js';
import { RawDataTable } from '../RawDataTable/RawDataTable.js';

import './ImportTemplateForm.scss';
import { FormControls } from '../../../../../Components/FormControls/FormControls.js';

/** CSS classes */
const VALID_FEEDBACK_CLASS = 'valid-feedback';
const INVALID_FEEDBACK_CLASS = 'invalid-feedback';

const defaultValidation = {
    name: true,
    firstRow: true,
    valid: true,
    columns: true,
};

const defaultProps = {
    onSubmit: null,
    onCancel: null,
};

/**
 * Import template form component
 */
export class ImportTemplateForm extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        if (!this.props?.mainAccount) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.state = {
            ...this.props,
            templates: App.model.templates.data,
            template: null,
            selectedColumn: null,
            validation: {
                ...defaultValidation,
            },
        };

        this.columnFeedback = {
            accountAmount: __('import.templates.accountAmountMessage'),
            accountCurrency: __('import.templates.accountCurrencyMessage'),
            transactionAmount: __('import.templates.transactionAmountMessage'),
            transactionCurrency: __('import.templates.transactionCurrencyMessage'),
            date: __('import.templates.dateMessage'),
            comment: __('import.templates.commentMessage'),
        };

        this.init();
    }

    init() {
        const elemIds = [
            'templateForm',
            'firstRowField',
            'firstRowInp',
            'decFirstRowBtn',
            'incFirstRowBtn',
            'tplAccountSwitchField',
            'tplAccountSwitch',
            'tplAccountField',
            'columnField',
            'dateFormatField',
            'rawDataTable',
            'tplFormFeedback',
        ];
        elemIds.forEach((id) => {
            this[id] = ge(id);
            if (!this[id]) {
                throw new Error('Failed to initialize upload file dialog');
            }
        });

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'tplNameInp',
            className: 'form-row',
            name: 'name',
            title: __('import.templates.name'),
            validate: true,
            feedbackMessage: __('import.templates.invalidName'),
            onInput: (e) => this.onTemplateNameInput(e),
        });
        this.templateForm.prepend(this.nameField.elem);

        this.columnDropDown = DropDown.create({
            elem: 'columnSel',
            onChange: (column) => this.onColumnChange(column),
        });

        // Date format field
        this.dateFormatSelect = DateFormatSelect.create({
            onItemSelect: (sel) => this.onDateFormatSelect(sel),
        });
        this.dateFormatField.append(this.dateFormatSelect.elem);

        // Template default account
        this.tplAccountSwitch = Switch.fromElement(this.tplAccountSwitch, {
            onChange: () => this.onTemplateAccountToggle(),
        });

        this.tplAccountDropDown = DropDown.create({
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (account) => this.onTemplateAccountChange(account),
        });
        App.initAccountsList(this.tplAccountDropDown);
        this.tplAccountField.append(this.tplAccountDropDown.elem);

        setEvents(this.firstRowInp, { input: () => this.onFirstRowInput() });
        DecimalInput.create({
            elem: this.firstRowInp,
            digits: 0,
            allowNegative: false,
        });
        setEvents(this.decFirstRowBtn, { click: () => this.onFirstRowDecrease() });
        setEvents(this.incFirstRowBtn, { click: () => this.onFirstRowIncrease() });

        // Submit controls
        this.controls = FormControls.create({
            submitBtnType: 'button',
            submitTitle: __('actions.save'),
            cancelBtnType: 'button',
            cancelTitle: __('actions.cancel'),
            onSubmitClick: () => this.onSubmit(),
            onCancelClick: () => this.onCancel(),
        });

        this.templateForm.append(this.controls.elem);

        this.reset();

        this.elem = this.templateForm;
    }

    /** Reset component state */
    reset() {
        this.setState({
            ...this.state,
            rawData: null,
            rowsToShow: 3,
            listLoading: false,
            template: null,
            selectedColumn: templateColumns[0],
            validation: {
                ...defaultValidation,
            },
        });

        this.hide();
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

    changeMainAccount(id) {
        if (this.state.mainAccount.id === id) {
            return;
        }
        const mainAccount = App.model.accounts.getItem(id);
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

    /**
     * Set specified template
     * @param {number} value - import template id
     */
    setTemplate(value) {
        const template = App.model.templates.getItem(value) ?? null;
        if (this.state.template?.id === template?.id) {
            return;
        }

        if (template?.account_id) {
            this.changeMainAccount(template.account_id);
        }

        this.validateTemplateAndSetState({
            ...this.state,
            template,
        });
    }

    /** Template name field 'input' event handler */
    onTemplateNameInput(e) {
        this.setState({
            ...this.state,
            template: new ImportTemplate({
                ...this.state.template,
                name: e.target.value,
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
        const { userAccounts } = App.model;

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

    onColumnChange(column) {
        this.setState({
            ...this.state,
            selectedColumn: column?.id,
        });
    }

    onDateFormatSelect(selected) {
        this.validateTemplateAndSetState({
            ...this.state,
            template: new ImportTemplate({
                ...this.state.template,
                date_locale: selected?.id,
            }),
        });
    }

    /** Notifyes template form state changed */
    notifyStateChanged() {
        if (!isFunction(this.props.onChangeState)) {
            return;
        }

        this.props.onChangeState(this.state.id);
    }

    /** Save template button 'click' event handler */
    onSubmit() {
        const { template } = this.state;

        const request = {
            name: template.name,
            type_id: template.type_id,
            account_id: template.account_id,
            first_row: template.first_row,
            date_locale: template.date_locale,
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
            request.id = template.id;
        }

        if (isFunction(this.state.onSubmit)) {
            this.state.onSubmit(request);
        }

        this.reset();
    }

    /** Cancel template button 'click' event handler */
    onCancel() {
        if (isFunction(this.state.onCancel)) {
            this.state.onCancel();
        }

        this.reset();
    }

    validateTemplateAndSetState(state = this.state) {
        const validation = this.validateTemplate(state.template, state.rawData);
        const newState = {
            ...state,
            validation: {
                ...state.validation,
                ...validation,
            },
        };

        if (!validation.valid && typeof validation.column === 'string') {
            newState.selectedColumn = validation.column;
        }

        this.setState(newState);
    }

    /** Raw data table column 'click' event handler */
    onDataColumnClick(index) {
        const { selectedColumn } = this.state;
        if (!selectedColumn) {
            throw new Error('Invalid column selection');
        }

        const { template } = this.state;
        this.validateTemplateAndSetState({
            ...this.state,
            template: new ImportTemplate({
                ...template,
                columns: {
                    ...template.columns,
                    [selectedColumn]: index + 1,
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

    /** Renders template form feedback */
    setFormFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFormFeedback, message, isValid);
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
        let currency = App.model.currency.findByCode(value);
        if (!currency) {
            return { valid: false, column: 'accountCurrency' };
        }
        // Transaction currency
        value = template.getProperty('transactionCurrency', data, true);
        currency = App.model.currency.findByCode(value);
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

        return { valid: true, column: true };
    }

    /** Render component */
    render(state) {
        const { validation } = state;

        const templateAvail = (App.model.templates.length > 0);

        this.columnDropDown.enable(!state.listLoading);
        this.dateFormatSelect.enable(!state.listLoading);

        // Name field
        this.nameField.setState((nameState) => ({
            ...nameState,
            value: state.template?.name ?? '',
            valid: validation.name,
            disabled: state.listLoading,
        }));

        // Raw data table
        if (!Array.isArray(state.rawData) || !state.rawData.length) {
            re(this.dataTable?.elem);
            return;
        }

        const scrollLeft = (this.dataTable) ? this.dataTable.scrollLeft : 0;

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

        this.firstRowInp.value = state.template.first_row;
        enable(this.decFirstRowBtn, state.template.first_row > 1);
        App.setValidation(this.firstRowField, validation.firstRow);

        const useTplAccount = state.template.account_id !== 0;
        this.tplAccountSwitch.check(useTplAccount);
        show(this.tplAccountField, useTplAccount);
        if (state.template.account_id !== 0) {
            this.tplAccountDropDown.setSelection(state.template.account_id);
        }

        const { selectedColumn } = state;
        show(this.dateFormatField, selectedColumn === 'date');
        this.dateFormatSelect.setSelection(state.template.date_locale);

        if (typeof validation.column === 'string') {
            const message = this.columnFeedback[validation.column];
            this.setFormFeedback(message, false);
        } else {
            this.setFormFeedback(__('import.templates.valid'), true);
        }

        this.columnDropDown.setSelection(state.selectedColumn);

        // Submit controls
        this.controls.setState((controlsState) => ({
            ...controlsState,
            cancelTitle: (
                (templateAvail && !state.listLoading)
                    ? __('actions.cancel')
                    : null
            ),
            loading: state.listLoading,
        }));
    }
}
