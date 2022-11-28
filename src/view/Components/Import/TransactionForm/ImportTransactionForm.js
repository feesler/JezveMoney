import {
    createElement,
    show,
    enable,
    isFunction,
    insertAfter,
    checkDate,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import { DateInput } from 'jezvejs/DateInput';
import { DatePicker } from 'jezvejs/DatePicker';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { InputGroup } from 'jezvejs/InputGroup';
import { Popup } from 'jezvejs/Popup';
import { fixFloat } from '../../../js/utils.js';
import { ImportTransactionBase } from '../TransactionBase/ImportTransactionBase.js';
import { Field } from '../../Field/Field.js';
import './style.scss';
import { ImportTransaction } from '../../../js/model/ImportTransaction.js';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';

/** CSS classes */
const POPUP_CLASS = 'import-form-popup';
const CONTAINER_CLASS = 'import-form';
const INV_FEEDBACK_CLASS = 'invalid-feedback';
const FORM_CONTAINER_CLASS = 'form-container';
const FORM_COLUMN_CLASS = 'form-rows';
const AMOUNT_COLUMN_CLASS = 'amount-col';
const TYPE_COLUMN_CLASS = 'type-col';
const FORM_ROW_CLASS = 'form-row';
const IG_INPUT_CLASS = 'input-group__input';
const IG_BUTTON_CLASS = 'input-group__btn';
const IG_BUTTON_TITLE_CLASS = 'input-group__btn-title';
const DEFAULT_INPUT_CLASS = 'stretch-input';
const AMOUNT_INPUT_CLASS = 'right-align-text';
/* Fields */
const TYPE_FIELD_CLASS = 'type-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const AMOUNT_FIELD_CLASS = 'amount-field';
const SRC_AMOUNT_FIELD_CLASS = 'src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'dest-amount-field';
const PERSON_FIELD_CLASS = 'person-field';
const DATE_FIELD_CLASS = 'date-field';
const COMMENT_FIELD_CLASS = 'comment-field';
/* Controls */
const CALENDAR_ICON_CLASS = 'icon calendar-icon';
/* Form controls */
const FORM_CONTROLS_CLASS = 'form-controls';
const SUBMIT_BUTTON_CLASS = 'btn submit-btn';
const CANCEL_BUTTON_CLASS = 'btn cancel-btn';
/* Sort state */
const SORT_CLASS = 'import-form_sort';

/** Strings */
const CREATE_TITLE = 'Create transaction';
const UPDATE_TITLE = 'Edit transaction';
/* Fields */
const TITLE_FIELD_AMOUNT = 'Amount';
const TITLE_FIELD_SRC_AMOUNT = 'Source amount';
const TITLE_FIELD_DEST_AMOUNT = 'Destination amount';
const TITLE_FIELD_DATE = 'Date';
const TITLE_FIELD_COMMENT = 'Comment';
const TITLE_FIELD_SRC_ACCOUNT = 'Source account';
const TITLE_FIELD_DEST_ACCOUNT = 'Destination account';
const TITLE_FIELD_PERSON = 'Person';
/* Validation messages */
const MSG_INCORRECT_AMOUNT = 'Input correct amount';
const MSG_INVALID_DATE = 'Input correct date';
/* Controls */
const SAVE_BTN_TITLE = 'Save';
const CANCEL_BTN_TITLE = 'Cancel';

const defaultProps = {
    isUpdate: false,
    collapsed: true,
    onSave: null,
    onCancel: null,
};

/**
 * ImportTransactionForm component
 */
export class ImportTransactionForm extends ImportTransactionBase {
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
        };

        this.menuEmptyClickHandler = () => this.hideMenu();

        this.init();
    }

    init() {
        const { createContainer } = window.app;

        this.createTypeField();
        this.createAccountField();
        this.createPersonField();
        this.createSourceAmountField();
        this.createDestAmountField();
        this.createDateField();
        this.createCommentField();

        this.topRow = createContainer(FORM_ROW_CLASS, [
            this.dateField.elem,
            this.commentField.elem,
        ]);

        this.formContainer = createContainer(FORM_CONTAINER_CLASS, [
            createContainer(`${FORM_COLUMN_CLASS} ${TYPE_COLUMN_CLASS}`, [
                this.trTypeField.elem,
                this.transferAccountField.elem,
                this.personField.elem,
            ]),
            createContainer(`${FORM_COLUMN_CLASS} ${AMOUNT_COLUMN_CLASS}`, [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            createContainer(FORM_COLUMN_CLASS, [
                this.topRow,
            ]),
        ]);

        this.feedbackElem = createElement('div', { props: { className: INV_FEEDBACK_CLASS } });
        show(this.feedbackElem, false);

        // Save button
        this.saveBtn = createElement('button', {
            props: {
                className: SUBMIT_BUTTON_CLASS,
                type: 'submit',
                textContent: SAVE_BTN_TITLE,
            },
        });
        // Cancel button
        this.cancelBtn = createElement('button', {
            props: {
                className: CANCEL_BUTTON_CLASS,
                type: 'button',
                textContent: CANCEL_BTN_TITLE,
            },
            events: { click: () => this.cancel() },
        });
        this.toggleExtBtn = this.createToggleButton();

        this.formControls = createContainer(FORM_CONTROLS_CLASS, [
            this.saveBtn,
            this.cancelBtn,
            this.toggleExtBtn,
        ]);

        this.initContainer(CONTAINER_CLASS, [
            this.formContainer,
            this.feedbackElem,
            this.formControls,
        ]);

        this.popup = Popup.create({
            id: 'transactionFormPopup',
            content: this.elem,
            title: 'Transaction',
            scrollMessage: true,
            onclose: () => this.cancel(),
            btn: {
                closeBtn: true,
            },
            className: POPUP_CLASS,
        });

        this.render(this.state);
    }

    /** Create transaction type field */
    createTypeField() {
        const transferDisabled = window.app.model.accounts.length < 2;
        const debtDisabled = !window.app.model.persons.length;
        const typeItems = [
            { id: 'expense', title: 'Expense' },
            { id: 'income', title: 'Income' },
            { id: 'transferfrom', title: 'Transfer from', disabled: transferDisabled },
            { id: 'transferto', title: 'Transfer to', disabled: transferDisabled },
            { id: 'debtfrom', title: 'Debt from', disabled: debtDisabled },
            { id: 'debtto', title: 'Debt to', disabled: debtDisabled },
        ];

        this.typeDropDown = DropDown.create({
            data: typeItems,
            onchange: (type) => this.onTrTypeChanged(type),
        });

        this.trTypeField = Field.create({
            title: 'Type',
            content: this.typeDropDown.elem,
            className: TYPE_FIELD_CLASS,
        });
    }

    /** Create destination(second) account field */
    createAccountField() {
        this.transferAccDropDown = DropDown.create({
            disabled: true,
            onchange: (account) => this.onTransferAccountChanged(account),
        });
        window.app.initAccountsList(this.transferAccDropDown);

        this.transferAccountField = Field.create({
            title: TITLE_FIELD_DEST_ACCOUNT,
            content: this.transferAccDropDown.elem,
            className: ACCOUNT_FIELD_CLASS,
        });
    }

    /** Create person field */
    createPersonField() {
        this.personDropDown = DropDown.create({
            disabled: true,
            onchange: (person) => this.onPersonChanged(person),
        });
        window.app.initPersonsList(this.personDropDown);

        this.personField = Field.create({
            title: TITLE_FIELD_PERSON,
            content: this.personDropDown.elem,
            className: PERSON_FIELD_CLASS,
        });
    }

    /** Create source amount field */
    createSourceAmountField() {
        this.srcAmountInp = createElement('input', {
            props: {
                className: `${IG_INPUT_CLASS} ${DEFAULT_INPUT_CLASS} ${AMOUNT_INPUT_CLASS}`,
                type: 'text',
                name: 'src_amount[]',
                disabled: true,
                placeholder: TITLE_FIELD_AMOUNT,
                autocomplete: 'off',
            },
        });
        this.srcAmountDecimalInput = DecimalInput.create({
            elem: this.srcAmountInp,
            digits: 2,
            oninput: () => this.onSrcAmountInput(),
        });

        this.srcCurrencySign = createElement('div', {
            props: { className: IG_BUTTON_TITLE_CLASS },
        });
        this.srcCurrencyBtn = createElement('button', {
            props: {
                type: 'button',
                className: IG_BUTTON_CLASS,
                tabIndex: -1,
            },
            children: this.srcCurrencySign,
        });

        this.srcCurrencyDropDown = DropDown.create({
            elem: this.srcCurrencySign,
            listAttach: true,
            onchange: (currency) => this.onSrcCurrChanged(currency),
        });
        window.app.initCurrencyList(this.srcCurrencyDropDown);

        this.srcAmountGroup = InputGroup.create({
            children: [this.srcAmountInp, this.srcCurrencyBtn],
        });
        this.srcAmountField = Field.create({
            title: TITLE_FIELD_AMOUNT,
            content: this.srcAmountGroup.elem,
            className: [AMOUNT_FIELD_CLASS, SRC_AMOUNT_FIELD_CLASS],
        });
    }

    /** Create destination amount field */
    createDestAmountField() {
        this.destAmountInp = createElement('input', {
            props: {
                className: `${IG_INPUT_CLASS} ${DEFAULT_INPUT_CLASS} ${AMOUNT_INPUT_CLASS}`,
                type: 'text',
                name: 'dest_amount[]',
                placeholder: TITLE_FIELD_DEST_AMOUNT,
                autocomplete: 'off',
            },
        });
        this.destAmountDecimalInput = DecimalInput.create({
            elem: this.destAmountInp,
            digits: 2,
            oninput: () => this.onDestAmountInput(),
        });

        this.destCurrencySign = createElement('div', {
            props: { className: IG_BUTTON_TITLE_CLASS },
        });
        this.destCurrencyBtn = createElement('button', {
            props: {
                type: 'button',
                className: IG_BUTTON_CLASS,
                tabIndex: -1,
            },
            children: this.destCurrencySign,
        });

        this.destCurrencyDropDown = DropDown.create({
            elem: this.destCurrencySign,
            listAttach: true,
            onchange: (currency) => this.onDestCurrChanged(currency),
        });
        window.app.initCurrencyList(this.destCurrencyDropDown);

        this.destAmountGroup = InputGroup.create({
            children: [this.destAmountInp, this.destCurrencyBtn],
        });

        this.destAmountField = Field.create({
            title: TITLE_FIELD_DEST_AMOUNT,
            content: this.destAmountGroup.elem,
            className: [AMOUNT_FIELD_CLASS, DEST_AMOUNT_FIELD_CLASS],
        });
        this.destAmountField.hide();
    }

    /** Create date field */
    createDateField() {
        const elem = createElement('input', { props: { type: 'text', autocomplete: 'off' } });
        this.dateInp = DateInput.create({
            elem,
            className: `${DEFAULT_INPUT_CLASS} ${IG_INPUT_CLASS}`,
            name: 'date[]',
            placeholder: TITLE_FIELD_DATE,
            locales: window.app.dateFormatLocale,
            oninput: () => this.onDateInput(),
        });

        const dateIcon = window.app.createIcon(
            'calendar-icon',
            CALENDAR_ICON_CLASS,
        );
        this.dateBtn = createElement('button', {
            props: {
                type: 'button',
                className: IG_BUTTON_CLASS,
            },
            children: dateIcon,
            events: { click: () => this.showDatePicker() },
        });

        this.dateGroup = InputGroup.create({
            children: [this.dateInp.elem, this.dateBtn],
        });
        this.dateField = Field.create({
            title: TITLE_FIELD_DATE,
            content: this.dateGroup.elem,
            className: DATE_FIELD_CLASS,
        });
    }

    createCommentField() {
        this.commInp = createElement('input', {
            props: {
                className: DEFAULT_INPUT_CLASS,
                type: 'text',
                name: 'comment[]',
                placeholder: TITLE_FIELD_COMMENT,
                autocomplete: 'off',
            },
            events: { input: () => this.onCommentInput() },
        });
        this.commentField = Field.create({
            title: TITLE_FIELD_COMMENT,
            content: this.commInp,
            className: COMMENT_FIELD_CLASS,
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
        this.state.isUpdate = false;
        this.state.collapsed = true;
    }

    /** Show/hide dialog */
    show(val) {
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Creates new transaction from state, run action on it and returns result */
    runAction(type, payload, state = this.state) {
        if (typeof type !== 'string' || !isFunction(state.transaction[type])) {
            throw new Error('Invalid action type');
        }

        const transaction = new ImportTransaction(this.state.transaction);
        transaction[type](payload);
        return transaction;
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
        this.setState({
            ...this.state,
            transaction: this.runAction('setTransactionType', type.id),
        });

        this.clearInvalid();
    }

    /** Destination account select 'change' event handler */
    onTransferAccountChanged(account) {
        this.setState({
            ...this.state,
            transaction: this.runAction('setTransferAccount', account.id),
        });

        this.clearInvalid();
    }

    /** Person select 'change' event handler */
    onPersonChanged(person) {
        this.setState({
            ...this.state,
            transaction: this.runAction('setPerson', person.id),
        });

        this.clearInvalid();
    }

    /** Source amount field 'input' event handler */
    onSrcAmountInput() {
        const { value } = this.srcAmountInp;
        this.setState({
            ...this.state,
            transaction: this.runAction('setSourceAmount', value),
        });

        this.clearInvalid();
    }

    /** Destination amount field 'input' event handler */
    onDestAmountInput() {
        const { value } = this.destAmountInp;
        this.setState({
            ...this.state,
            transaction: this.runAction('setDestAmount', value),
        });
        this.clearInvalid();
    }

    /** Currency select 'change' event handler */
    onSrcCurrChanged(currency) {
        this.setState({
            ...this.state,
            transaction: this.runAction('setSourceCurrency', currency.id),
        });

        this.clearInvalid();
    }

    /** Currency select 'change' event handler */
    onDestCurrChanged(currency) {
        this.setState({
            ...this.state,
            transaction: this.runAction('setDestCurrency', currency.id),
        });

        this.clearInvalid();
    }

    /** Date field 'input' event handler */
    onDateInput() {
        const { value } = this.dateInp;
        this.setState({
            ...this.state,
            transaction: this.runAction('setDate', value),
        });

        this.clearInvalid();
    }

    /** DatePicker select event handler */
    onDateSelect(date) {
        const dateFmt = window.app.formatDate(date);
        this.setState({
            ...this.state,
            transaction: this.runAction('setDate', dateFmt),
        });

        this.datePicker.hide();
        this.clearInvalid();
    }

    /** Comment field 'input' event handler */
    onCommentInput() {
        const { value } = this.commInp;
        this.setState({
            ...this.state,
            transaction: this.runAction('setComment', value),
        });

        this.clearInvalid();
    }

    /** Validate transaction object */
    setFeedback(value) {
        if (typeof value === 'string' && value.length > 0) {
            this.feedbackElem.textContent = value;
            show(this.feedbackElem, true);
        } else {
            this.feedbackElem.textContent = '';
            show(this.feedbackElem, false);
        }
    }

    /** Remove all invalidated marks */
    clearInvalid() {
        window.app.clearBlockValidation(this.srcAmountField.elem);
        window.app.clearBlockValidation(this.destAmountField.elem);
        window.app.clearBlockValidation(this.dateField.elem);
        this.setFeedback();
    }

    validateSourceAmount(state) {
        const amountValue = parseFloat(fixFloat(state.sourceAmount));
        if (Number.isNaN(amountValue) || amountValue <= 0) {
            window.app.invalidateBlock(this.srcAmountField.elem);
            this.setFeedback(MSG_INCORRECT_AMOUNT);
            return false;
        }

        return true;
    }

    validateDestAmount(state) {
        const amountValue = parseFloat(fixFloat(state.destAmount));
        if (Number.isNaN(amountValue) || amountValue <= 0) {
            window.app.invalidateBlock(this.destAmountField.elem);
            this.setFeedback(MSG_INCORRECT_AMOUNT);
            return false;
        }

        return true;
    }

    /** Validate transaction object */
    validate() {
        const { state } = this;
        const isDiff = state.transaction.isDiff();
        const transaction = state.transaction.state;

        if (transaction.type === 'expense') {
            const destAmountValid = this.validateDestAmount(transaction);
            if (!destAmountValid) {
                return false;
            }
            if (isDiff) {
                const srcAmountValid = this.validateSourceAmount(transaction);
                if (!srcAmountValid) {
                    return false;
                }
            }
        } else {
            const srcAmountValid = this.validateSourceAmount(transaction);
            if (!srcAmountValid) {
                return false;
            }
            if (isDiff) {
                const destAmountValid = this.validateDestAmount(transaction);
                if (!destAmountValid) {
                    return false;
                }
            }
        }

        if (!checkDate(transaction.date)) {
            window.app.invalidateBlock(this.dateField.elem);
            this.setFeedback(MSG_INVALID_DATE);
            return false;
        }

        return true;
    }

    onSubmit(e) {
        e?.preventDefault();

        if (!this.validate()) {
            return;
        }

        this.reset();
        if (isFunction(this.props.onSave)) {
            this.props.onSave(this.state.transaction);
        }
    }

    cancel() {
        this.reset();
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    renderCurrency(elem, ddown, currencyId) {
        const signElem = elem;
        if (!signElem) {
            return;
        }

        const curr = window.app.model.currency.getItem(currencyId);
        if (!curr) {
            return;
        }

        signElem.textContent = curr.sign;
        ddown?.selectItem(currencyId);
    }

    enableCurrency(currBtn, signElem, value) {
        currBtn.classList.toggle('input-group__btn', value);
        currBtn.classList.toggle('input-group__text', !value);
        signElem.classList.toggle('input-group__btn-title', value);
        signElem.classList.toggle('input-group__text-title', !value);
    }

    enableSourceCurrency(value) {
        this.enableCurrency(this.srcCurrencyBtn, this.srcCurrencySign, value);
    }

    enableDestCurrency(value) {
        this.enableCurrency(this.destCurrencyBtn, this.destCurrencySign, value);
    }

    /** Show date pciker */
    showDatePicker() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.dateGroup.elem,
                locales: window.app.datePickerLocale,
                ondateselect: (date) => this.onDateSelect(date),
            });
            insertAfter(this.datePicker.elem, this.dateGroup.elem);
        }

        this.datePicker.show(!this.datePicker.visible());
    }

    renderOriginalData(state, prevState) {
        const { originalData } = state.transaction;
        if (originalData === prevState?.transaction?.originalData) {
            return;
        }

        if (!originalData) {
            this.collapse?.hide();
            return;
        }

        const container = OriginalImportData.create({
            ...originalData,
        });

        const content = [container.elem];
        const { similarTransaction } = state.transaction;
        if (similarTransaction) {
            const infoElem = this.createSimilarTransactionInfo(similarTransaction);
            content.push(infoElem);
        }

        if (!this.collapse) {
            this.collapse = Collapsible.create({
                toggleOnClick: false,
                className: CONTAINER_CLASS,
                header: null,
            });

            this.elem.append(this.collapse.elem);
        }

        this.collapse.setContent(content);
    }

    renderForm(state, prevState) {
        if (state.transaction === prevState?.transaction) {
            return;
        }

        const isDiff = state.transaction.isDiff();
        const transaction = state.transaction.state;

        const isIncome = transaction.type === 'income';
        const isTransfer = ['transferfrom', 'transferto'].includes(transaction.type);
        const isDebt = ['debtfrom', 'debtto'].includes(transaction.type);

        enable(this.elem, transaction.enabled);
        this.elem.classList.toggle(SORT_CLASS, transaction.listMode === 'sort');

        // Type field
        this.typeDropDown.enable(transaction.enabled);
        this.typeDropDown.selectItem(transaction.type);

        // Amount field
        if (transaction.type === 'expense') {
            // Destination amount field
            this.destAmountInp.value = transaction.destAmount;
            enable(this.destAmountInp, transaction.enabled);

            this.enableDestCurrency(true);
            this.destCurrencyDropDown.enable(transaction.enabled);
            this.renderCurrency(
                this.destCurrencySign,
                this.destCurrencyDropDown,
                transaction.destCurrId,
            );
            this.destAmountField.show();

            const destAmountLabel = (isDiff)
                ? TITLE_FIELD_DEST_AMOUNT
                : TITLE_FIELD_AMOUNT;
            this.destAmountInp.placeholder = destAmountLabel;
            this.destAmountField.setTitle(destAmountLabel);

            // Source amount field
            this.srcAmountInp.value = transaction.sourceAmount;
            enable(this.srcAmountInp, transaction.enabled && isDiff);

            this.enableSourceCurrency(false);
            this.srcCurrencyDropDown.enable(false);
            this.renderCurrency(
                this.srcCurrencySign,
                this.srcCurrencyDropDown,
                transaction.srcCurrId,
            );
            this.srcAmountField.show(isDiff);

            this.srcAmountInp.placeholder = TITLE_FIELD_SRC_AMOUNT;
            this.srcAmountField.setTitle(TITLE_FIELD_SRC_AMOUNT);
        } else {
            // Source amount field
            this.srcAmountInp.value = transaction.sourceAmount;
            enable(this.srcAmountInp, transaction.enabled);

            this.enableSourceCurrency(isIncome);
            this.srcCurrencyDropDown.enable(transaction.enabled && isIncome);
            this.renderCurrency(
                this.srcCurrencySign,
                this.srcCurrencyDropDown,
                transaction.srcCurrId,
            );
            this.srcAmountField.show();

            const srcAmountLabel = (isDiff)
                ? TITLE_FIELD_SRC_AMOUNT
                : TITLE_FIELD_AMOUNT;
            this.srcAmountInp.placeholder = srcAmountLabel;
            this.srcAmountField.setTitle(srcAmountLabel);

            // Destination amount field
            this.destAmountInp.value = transaction.destAmount;
            enable(this.destAmountInp, transaction.enabled && isDiff);

            this.enableDestCurrency(false);
            this.destCurrencyDropDown.enable(false);
            this.renderCurrency(
                this.destCurrencySign,
                this.destCurrencyDropDown,
                transaction.destCurrId,
            );
            this.destAmountField.show(isDiff);

            this.destAmountInp.placeholder = TITLE_FIELD_DEST_AMOUNT;
            this.destAmountField.setTitle(TITLE_FIELD_DEST_AMOUNT);
        }

        enable(this.srcCurrencyBtn, transaction.enabled);
        enable(this.destCurrencyBtn, transaction.enabled);

        // Second account field
        this.transferAccDropDown.enable(transaction.enabled && isTransfer);
        if (isTransfer) {
            const strMainAccountId = transaction.mainAccount.id.toString();
            const accountItems = this.transferAccDropDown.getVisibleItems();
            accountItems.forEach((accountItem) => this.transferAccDropDown.enableItem(
                accountItem.id,
                accountItem.id !== strMainAccountId,
            ));

            const transferAccountId = (transaction.type === 'transferto')
                ? transaction.sourceAccountId
                : transaction.destAccountId;
            if (transferAccountId) {
                this.transferAccDropDown.selectItem(transferAccountId);
            }

            const accountLabel = (transaction.type === 'transferto')
                ? TITLE_FIELD_SRC_ACCOUNT
                : TITLE_FIELD_DEST_ACCOUNT;
            this.transferAccountField.setTitle(accountLabel);
        }
        this.transferAccountField.show(isTransfer);

        // Person field
        this.personDropDown.enable(transaction.enabled && isDebt);
        if (transaction.personId) {
            this.personDropDown.selectItem(transaction.personId);
        }
        this.personField.show(isDebt);

        // Date field
        enable(this.dateBtn, transaction.enabled);
        this.dateInp.enable(transaction.enabled);
        this.dateInp.value = transaction.date;

        // Commend field
        enable(this.commInp, transaction.enabled);
        this.commInp.value = transaction.comment;
    }

    /** Render component */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const title = (state.isUpdate) ? UPDATE_TITLE : CREATE_TITLE;
        this.popup.setTitle(title);

        this.renderForm(state, prevState);
        this.renderOriginalData(state, prevState);

        const { originalData } = state.transaction;
        show(this.toggleExtBtn, !!originalData);
        this.toggleExtBtn.classList.toggle('rotate', !state.collapsed);
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
