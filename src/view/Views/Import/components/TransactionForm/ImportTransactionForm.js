import { isFunction } from '@jezvejs/types';
import { Component } from 'jezvejs';
import { fixFloat } from '@jezvejs/number';
import { createElement, enable } from '@jezvejs/dom';
import { Collapsible } from 'jezvejs/Collapsible';
import { DropDown } from 'jezvejs/DropDown';
import { Popup } from 'jezvejs/Popup';

import {
    __,
    dateStringToTime,
    parseDate,
} from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';

import { transTypeMap, typeNames, ImportTransaction } from '../../../../Models/ImportTransaction.js';
import { ACCOUNT_TYPE_CREDIT_CARD } from '../../../../Models/Account.js';

import { Field } from '../../../../Components/Common/Field/Field.js';
import { InputField } from '../../../../Components/Form/Fields/InputField/InputField.js';
import { AmountInputField } from '../../../../Components/Form/Fields/AmountInputField/AmountInputField.js';
import { DateInputField } from '../../../../Components/Form/Fields/DateInputField/DateInputField.js';
import { ReminderField } from '../../../../Components/Reminder/ReminderField/ReminderField.js';
import { CategorySelect } from '../../../../Components/Category/CategorySelect/CategorySelect.js';
import { ToggleButton } from '../../../../Components/Common/ToggleButton/ToggleButton.js';
import { FormControls } from '../../../../Components/Form/FormControls/FormControls.js';

import { OriginalImportData } from '../OriginalData/OriginalImportData.js';
import { SimilarTransactionInfo } from '../SimilarTransactionInfo/SimilarTransactionInfo.js';

import './ImportTransactionForm.scss';

/** CSS classes */
const POPUP_CLASS = 'import-form-popup';
const CONTAINER_CLASS = 'import-form';
/* Fields */
const TYPE_FIELD_CLASS = 'form-row type-field';
const ACCOUNT_FIELD_CLASS = 'form-row account-field';
const SRC_AMOUNT_FIELD_CLASS = 'form-row amount-field src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'form-row amount-field dest-amount-field';
const PERSON_FIELD_CLASS = 'form-row person-field';
const DATE_FIELD_CLASS = 'form-row date-field';
const CATEGORY_FIELD_CLASS = 'form-row category-field';
const COMMENT_FIELD_CLASS = 'form-row comment-field';
const REMINDER_FIELD_CLASS = 'form-row reminder-field';

const validateDateOptions = {
    fixShortYear: false,
};

const defaultProps = {
    isUpdate: false,
    collapsed: true,
    onSave: null,
    onCancel: null,
};

const defaultValidation = {
    valid: true,
    sourceAmount: true,
    destAmount: true,
    date: true,
};

/**
 * Import transaction form component
 */
export class ImportTransactionForm extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        if (!this.props?.transaction?.mainAccount) {
            throw new Error('Invalid props');
        }

        this.state = {
            ...this.props,
            validation: {
                ...defaultValidation,
            },
        };

        this.menuEmptyClickHandler = () => this.hideMenu();

        this.init();
    }

    init() {
        this.createTypeField();
        this.createAccountField();
        this.createPersonField();
        this.createSourceAmountField();
        this.createDestAmountField();
        this.createDateField();
        this.createCategoryField();
        this.createCommentField();

        this.toggleExtBtn = ToggleButton.create({
            onClick: () => this.toggleCollapse(),
        });

        // Submit controls
        this.formControls = FormControls.create({
            submitBtn: {
                title: __('actions.save'),
            },
            cancelBtn: {
                type: 'button',
                title: __('actions.cancel'),
                onClick: () => this.cancel(),
            },
            controls: [
                this.toggleExtBtn.elem,
            ],
        });

        this.initContainer(CONTAINER_CLASS, [
            this.trTypeField.elem,
            this.transferAccountField.elem,
            this.personField.elem,
            this.srcAmountField.elem,
            this.destAmountField.elem,
            this.dateField.elem,
            this.categoryField.elem,
            this.commentField.elem,
            this.formControls.elem,
        ]);

        this.popup = Popup.create({
            id: 'transactionFormPopup',
            content: this.elem,
            closeButton: true,
            onClose: () => this.cancel(),
            className: POPUP_CLASS,
        });

        this.render(this.state);
    }

    /** Create transaction type field */
    createTypeField() {
        this.typeDropDown = DropDown.create({
            onChange: (type) => this.onTrTypeChanged(type),
        });

        this.trTypeField = Field.create({
            title: __('transactions.type'),
            content: this.typeDropDown.elem,
            className: TYPE_FIELD_CLASS,
        });
    }

    /** Create destination(second) account field */
    createAccountField() {
        this.transferAccDropDown = DropDown.create({
            disabled: true,
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (account) => this.onTransferAccountChanged(account),
        });
        App.initAccountsList(this.transferAccDropDown);

        this.transferAccountField = Field.create({
            title: __('transactions.destAccount'),
            content: this.transferAccDropDown.elem,
            className: ACCOUNT_FIELD_CLASS,
        });
    }

    /** Create person field */
    createPersonField() {
        this.personDropDown = DropDown.create({
            disabled: true,
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (person) => this.onPersonChanged(person),
        });
        App.initPersonsList(this.personDropDown);

        this.personField = Field.create({
            content: this.personDropDown.elem,
            className: PERSON_FIELD_CLASS,
        });
    }

    /** Create source amount field */
    createSourceAmountField() {
        this.srcAmountField = AmountInputField.create({
            title: __('transactions.amount'),
            feedbackMessage: __('transactions.invalidAmount'),
            placeholder: __('transactions.amount'),
            validate: true,
            className: SRC_AMOUNT_FIELD_CLASS,
            onInput: (e) => this.onSrcAmountInput(e),
            onSelectCurrency: (item) => this.onSrcCurrChanged(item),
        });
    }

    /** Create destination amount field */
    createDestAmountField() {
        this.destAmountField = AmountInputField.create({
            title: __('transactions.destAmount'),
            feedbackMessage: __('transactions.invalidAmount'),
            placeholder: __('transactions.destAmount'),
            validate: true,
            className: DEST_AMOUNT_FIELD_CLASS,
            onInput: (e) => this.onDestAmountInput(e),
            onSelectCurrency: (item) => this.onDestCurrChanged(item),
        });
        this.destAmountField.hide();
    }

    /** Create date field */
    createDateField() {
        this.dateField = DateInputField.create({
            title: __('transactions.date'),
            feedbackMessage: __('transactions.invalidDate'),
            className: DATE_FIELD_CLASS,
            name: 'date[]',
            placeholder: __('transactions.date'),
            locales: App.dateFormatLocale,
            validate: true,
            onInput: (e) => this.onDateInput(e),
            onDateSelect: (e) => this.onDateSelect(e),
        });
    }

    createCategoryField() {
        this.categorySelect = CategorySelect.create({
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (category) => this.onCategoryChanged(category),
        });

        this.categoryField = Field.create({
            title: __('transactions.category'),
            content: this.categorySelect.elem,
            className: CATEGORY_FIELD_CLASS,
        });
    }

    createCommentField() {
        this.commentField = InputField.create({
            id: 'commentField',
            inputId: 'commInp',
            className: COMMENT_FIELD_CLASS,
            name: 'name',
            title: __('transactions.comment'),
            placeholder: __('transactions.comment'),
            onInput: (e) => this.onCommentInput(e),
        });
    }

    /** Creates reminder field */
    createReminderField() {
        this.reminderField = ReminderField.create({
            title: __('transactions.reminder'),
            className: REMINDER_FIELD_CLASS,
            onSelect: (reminder) => this.onSelectReminder(reminder),
            onRemove: () => this.onRemoveReminder(),
        });
    }

    initContainer(className, children) {
        this.elem = createElement('form', {
            props: { className },
            children,
            events: { submit: (e) => this.onSubmit(e) },
        });
    }

    reset() {
        this.setState({
            ...this.state,
            validation: {
                ...defaultValidation,
            },
            isUpdate: false,
            collapsed: true,
        });
    }

    /** Show/hide dialog */
    show(val) {
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Toggle collapse/expand button 'click' event handler */
    toggleCollapse() {
        this.setState({
            ...this.state,
            collapsed: !this.state.collapsed,
        });
    }

    /** Transaction type select 'change' event handler */
    onTrTypeChanged(type) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setTransactionType(type.id),
            validation: defaultValidation,
        });
    }

    /** Destination account select 'change' event handler */
    onTransferAccountChanged(account) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setTransferAccount(account.id),
            validation: defaultValidation,
        });
    }

    /** Person select 'change' event handler */
    onPersonChanged(person) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setPerson(person.id),
            validation: defaultValidation,
        });
    }

    /** Source amount field 'input' event handler */
    onSrcAmountInput(e) {
        const { value } = e.target;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setSourceAmount(value),
            validation: defaultValidation,
        });
    }

    /** Destination amount field 'input' event handler */
    onDestAmountInput(e) {
        const { value } = e.target;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDestAmount(value),
            validation: defaultValidation,
        });
    }

    /** Currency select 'change' event handler */
    onSrcCurrChanged(currency) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setSourceCurrency(currency.id),
            validation: defaultValidation,
        });
    }

    /** Currency select 'change' event handler */
    onDestCurrChanged(currency) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDestCurrency(currency.id),
            validation: defaultValidation,
        });
    }

    /** Date field 'input' event handler */
    onDateInput(e) {
        const { value } = e.target;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDate(value),
            validation: defaultValidation,
        });
    }

    /** DatePicker select event handler */
    onDateSelect(date) {
        const dateFmt = App.formatInputDate(date);
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDate(dateFmt),
            validation: defaultValidation,
        });

        this.dateField.datePicker.hide();
    }

    /** Category select 'change' event handler */
    onCategoryChanged(category) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setCategory(category.id),
            validation: defaultValidation,
        });
    }

    /** Comment field 'input' event handler */
    onCommentInput(e) {
        const { value } = e.target;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setComment(value),
            validation: defaultValidation,
        });
    }

    onSelectReminder(reminder) {
        if (!reminder) {
            return;
        }
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setReminder(reminder),
        });
    }

    onRemoveReminder() {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.removeReminder(),
        });
    }

    validateAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return (!Number.isNaN(amount) && amount > 0);
    }

    /** Validate transaction object */
    validate() {
        const { transaction } = this.state;
        const isDiff = transaction.isDiff();
        const isExpense = (transaction.type === 'expense');
        const isLimit = (transaction.type === 'limit');

        const sourceAmount = ((!isExpense && !isLimit) || isDiff)
            ? transaction.validateSourceAmount()
            : true;

        const destAmount = (isExpense || isLimit || isDiff)
            ? transaction.validateDestAmount()
            : true;

        const date = App.isValidDateString(transaction.date, validateDateOptions);
        const valid = (sourceAmount && destAmount && date);

        if (!valid) {
            this.setState({
                ...this.state,
                validation: {
                    sourceAmount,
                    destAmount,
                    date,
                    valid,
                },
            });
        }

        return valid;
    }

    getData() {
        const { transaction } = this.state;
        return new ImportTransaction({
            ...transaction,
            date: App.formatDate(parseDate(transaction.date)),
        });
    }

    onSubmit(e) {
        e?.preventDefault();

        if (!this.validate()) {
            return;
        }

        this.reset();
        if (!isFunction(this.props.onSave)) {
            return;
        }

        const transaction = this.getData();
        this.props.onSave(transaction);
    }

    cancel() {
        this.reset();
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    renderOriginalData(state, prevState) {
        const { originalData } = state.transaction;
        if (originalData === prevState?.transaction?.originalData) {
            return;
        }

        this.collapse?.show(!!originalData);
        if (!originalData) {
            return;
        }

        const container = OriginalImportData.create({
            ...originalData,
        });

        const content = [container.elem];
        const { similarTransaction } = state.transaction;
        if (similarTransaction) {
            const info = SimilarTransactionInfo.create(similarTransaction);
            content.push(info.elem);
        }

        if (!this.collapse) {
            this.collapse = Collapsible.create({
                toggleOnClick: false,
                animated: true,
                header: null,
            });

            this.elem.append(this.collapse.elem);
        }

        this.collapse.setContent(content);
    }

    renderTypeSelect(state, prevState) {
        const transferDisabled = App.model.accounts.length < 2;
        const debtDisabled = !App.model.persons.length;
        const { mainAccount } = state.transaction;

        if (mainAccount.id !== prevState?.transaction?.mainAccount?.id) {
            const typeItems = Object.entries(typeNames).map(([id, title]) => ({
                id,
                title,
                disabled: (
                    (id.startsWith('transfer') && transferDisabled)
                    || (id.startsWith('debt') && debtDisabled)
                ),
            })).filter((item) => (
                item.id !== 'limit' || mainAccount.type === ACCOUNT_TYPE_CREDIT_CARD
            ));

            this.typeDropDown.removeAll();
            this.typeDropDown.append(typeItems);
        }

        this.typeDropDown.enable(state.transaction.enabled);
        this.typeDropDown.setSelection(state.transaction.type);
    }

    renderForm(state, prevState) {
        if (
            state.transaction === prevState?.transaction
            && state.validation === prevState?.validation
        ) {
            return;
        }

        const transaction = new ImportTransaction(state.transaction);
        const isDiff = transaction.isDiff();
        const realType = transTypeMap[transaction.type];
        if (!realType) {
            throw new Error(`Invalid type of import transaction: ${transaction.type}`);
        }
        const isExpense = transaction.type === 'expense';
        const isIncome = transaction.type === 'income';
        const isTransfer = ['transfer_out', 'transfer_in'].includes(transaction.type);
        const isDebt = ['debt_out', 'debt_in'].includes(transaction.type);
        const isLimit = (transaction.type === 'limit');

        enable(this.elem, transaction.enabled);

        // Type field
        this.renderTypeSelect(state, prevState);

        // Source amount field
        const showSrcAmount = ((!isExpense && !isLimit) || isDiff);
        const srcAmountLabel = (!isExpense && !isDiff)
            ? __('transactions.amount')
            : __('transactions.sourceAmount');

        this.srcAmountField.show(showSrcAmount);
        this.srcAmountField.setState((srcAmountState) => ({
            ...srcAmountState,
            title: srcAmountLabel,
            value: transaction.sourceAmount,
            placeholder: srcAmountLabel,
            disabled: !(transaction.enabled && showSrcAmount),
            currencyId: transaction.srcCurrId,
            valid: state.validation.sourceAmount,
            enableSelect: transaction.enabled && isIncome,
        }));

        // Destination amount field
        const showDestAmount = (isExpense || isLimit || isDiff);
        const destAmountLabel = ((isExpense || isLimit) && !isDiff)
            ? __('transactions.amount')
            : __('transactions.destAmount');

        this.destAmountField.show(showDestAmount);
        this.destAmountField.setState((destAmountState) => ({
            ...destAmountState,
            title: destAmountLabel,
            value: transaction.destAmount,
            placeholder: destAmountLabel,
            disabled: !(transaction.enabled && showDestAmount),
            currencyId: transaction.destCurrId,
            valid: state.validation.destAmount,
            enableSelect: transaction.enabled && isExpense,
        }));

        // Transfer account field
        this.transferAccDropDown.enable(transaction.enabled && isTransfer);
        if (isTransfer) {
            const strMainAccountId = transaction.mainAccount.id.toString();
            const accountItems = this.transferAccDropDown.getVisibleItems();
            accountItems.forEach((accountItem) => this.transferAccDropDown.enableItem(
                accountItem.id,
                accountItem.id !== strMainAccountId,
            ));

            const transferAccountId = (transaction.type === 'transfer_in')
                ? transaction.sourceAccountId
                : transaction.destAccountId;
            if (transferAccountId) {
                this.transferAccDropDown.setSelection(transferAccountId);
            }

            const accountLabel = (transaction.type === 'transfer_in')
                ? __('transactions.sourceAccount')
                : __('transactions.destAccount');
            this.transferAccountField.setTitle(accountLabel);
        }
        this.transferAccountField.show(isTransfer);

        // Person field
        if (transaction.type === 'debt_in') {
            this.personField.setTitle(__('transactions.sourcePerson'));
        } else if (transaction.type === 'debt_out') {
            this.personField.setTitle(__('transactions.destPerson'));
        }

        this.personDropDown.enable(transaction.enabled && isDebt);
        if (transaction.personId) {
            this.personDropDown.setSelection(transaction.personId);
        }
        this.personField.show(isDebt);

        // Date field
        this.dateField.setState((dateState) => ({
            ...dateState,
            value: transaction.date,
            date: dateStringToTime(transaction.date),
            disabled: !transaction.enabled,
            valid: state.validation.date,
        }));

        // Category field
        this.categorySelect.setType(realType);
        this.categorySelect.enable(transaction.enabled);
        this.categorySelect.setSelection(transaction.categoryId);

        // Commend field
        this.commentField.setState((commentState) => ({
            ...commentState,
            value: transaction.comment,
            disabled: !transaction.enabled,
        }));

        this.renderReminder(state, prevState);
    }

    renderReminder(state, prevState) {
        if (App.model.schedule.length === 0) {
            this.reminderField?.elem?.remove();
            this.reminderField = null;
            return;
        }

        const { transaction } = state;
        const prevTransaction = prevState?.transaction;
        if (
            transaction.reminderId === prevTransaction?.reminderId
            && transaction.scheduleId === prevTransaction?.scheduleId
            && transaction.reminderDate === prevTransaction?.reminderDate
        ) {
            return;
        }

        if (!this.reminderField) {
            this.createReminderField();
            this.commentField.elem.after(this.reminderField.elem);
        }

        this.reminderField.setState((fieldState) => ({
            ...fieldState,
            reminder_id: transaction.reminderId,
            schedule_id: transaction.scheduleId,
            reminder_date: transaction.reminderDate,
        }));
        this.reminderField.show();
    }

    /** Render component */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const title = (state.isUpdate) ? __('transactions.update') : __('transactions.create');
        this.popup.setTitle(title);

        this.renderForm(state, prevState);
        this.renderOriginalData(state, prevState);

        const { originalData } = state.transaction;
        this.toggleExtBtn.show(!!originalData);
        this.toggleExtBtn.elem.classList.toggle('rotate', !state.collapsed);
        if (!this.collapse) {
            return;
        }
        if (state.collapsed) {
            this.collapse.collapse();
        } else {
            this.collapse.expand();
        }
    }
}
