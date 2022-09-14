import {
    ce,
    show,
    enable,
    insertAfter,
    checkDate,
    Checkbox,
    DatePicker,
    DropDown,
    DecimalInput,
    InputGroup,
} from 'jezvejs';
import { fixFloat } from '../../../js/utils.js';
import { ImportTransactionBase, sourceTypes } from '../TransactionBase/ImportTransactionBase.js';
import { Field } from '../Field/Field.js';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'import-form';
const ENABLE_CHECK_CLASS = 'enable-check';
const MAIN_CONTENT_CLASS = 'main-content';
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
const AMOUNT_INPUT_CLASS = 'amount-input';
/* Fields */
const AMOUNT_FIELD_CLASS = 'amount-field';
const DATE_FIELD_CLASS = 'date-field';
const COMMENT_FIELD_CLASS = 'comment-field';
/* Controls */
const CONTROLS_CLASS = 'controls';
const DEFAULT_BUTTON_CLASS = 'btn';
const DEL_BUTTON_CLASS = 'delete-btn';
const DEFAULT_ICON_CLASS = 'icon';
const DEL_ICON_CLASS = 'delete-icon';
const CALENDAR_ICON_CLASS = 'calendar-icon';

/** Fields */
const TITLE_FIELD_AMOUNT = 'Amount';
const TITLE_FIELD_SRC_AMOUNT = 'Source amount';
const TITLE_FIELD_DEST_AMOUNT = 'Destination amount';
const TITLE_FIELD_DATE = 'Date';
const TITLE_FIELD_COMMENT = 'Comment';
const TITLE_FIELD_SRC_ACCOUNT = 'Source account';
const TITLE_FIELD_DEST_ACCOUNT = 'Destination account';
const TITLE_FIELD_PERSON = 'Person';
/** Validation messages */
const MSG_INCORRECT_AMOUNT = 'Please input correct amount';
const MSG_INVALID_DATE = 'Please input correct date';

const defaultProps = {
    enabled: true,
    type: 'expense',
    sourceAccountId: 0,
    destAccountId: 0,
    srcCurrId: 0,
    destCurrId: 0,
    isDiff: false,
    sourceAmount: '',
    destAmount: '',
    personId: 0,
    date: null,
    comment: '',
    onEnable: null,
    onRemove: null,
};

/**
 * ImportTransactionForm component
 */
export class ImportTransactionForm extends ImportTransactionBase {
    static create(props) {
        return new ImportTransactionForm(props);
    }

    constructor(...args) {
        super(...args);

        if (!this.props?.mainAccount) {
            throw new Error('Invalid props');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };
        if (this.props.date == null) {
            this.props.date = window.app.formatDate(new Date());
        }

        const { mainAccount } = this.props;
        const state = {
            mainAccount,
            ...this.props,
        };

        if (sourceTypes.includes(state.type)) {
            state.sourceAccountId = mainAccount.id;
            state.srcCurrId = mainAccount.curr_id;
            if (!state.destCurrId) {
                state.destCurrId = mainAccount.curr_id;
            }

            if (state.type === 'transferfrom') {
                const account = this.getTransferAccount(state, state.destAccountId);
                state.destAccountId = account.id;
                state.destCurrId = account.curr_id;
            }
        } else {
            state.destAccountId = mainAccount.id;
            state.destCurrId = mainAccount.curr_id;
            if (!state.srcCurrId) {
                state.srcCurrId = mainAccount.curr_id;
            }

            if (state.type === 'transferto') {
                const account = this.getTransferAccount(state, state.sourceAccountId);
                state.sourceAccountId = account.id;
                state.srcCurrId = account.curr_id;
            }
        }

        if (state.type === 'debtfrom' || state.type === 'debtto') {
            if (!state.personId) {
                const person = window.app.model.persons.getItemByIndex(0);
                if (!person) {
                    throw new Error('Person not found');
                }
                state.personId = person.id;
            }
        }

        this.state = this.checkStateCurrencies(state);

        this.data = null;
        if (this.props.originalData) {
            this.saveOriginal(this.props.originalData);
        }

        this.init();
    }

    get enabled() {
        return this.state.enabled;
    }

    init() {
        // Row enable checkbox
        this.enableCheck = Checkbox.create({
            className: ENABLE_CHECK_CLASS,
            onChange: () => this.onRowChecked(),
        });

        this.createTypeField();
        this.createAccountField();
        this.createPersonField();
        this.createSourceAmountField();
        this.createDestAmountField();
        this.createDateField();

        // Comment field
        this.commInp = ce('input', {
            className: DEFAULT_INPUT_CLASS,
            type: 'text',
            name: 'comment[]',
            placeholder: TITLE_FIELD_COMMENT,
            autocomplete: 'off',
        }, null, { input: () => this.onCommentInput() });
        this.commentField = Field.create({
            title: TITLE_FIELD_COMMENT,
            content: this.commInp,
            className: COMMENT_FIELD_CLASS,
        });
        // Delete button
        this.delBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${DEL_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('del', `${DEFAULT_ICON_CLASS} ${DEL_ICON_CLASS}`),
            { click: () => this.remove() },
        );

        this.topRow = window.app.createContainer(FORM_ROW_CLASS, [
            this.dateField.elem,
            this.commentField.elem,
        ]);

        this.formContainer = window.app.createContainer(FORM_CONTAINER_CLASS, [
            window.app.createContainer(`${FORM_COLUMN_CLASS} ${TYPE_COLUMN_CLASS}`, [
                this.trTypeField.elem,
                this.transferAccountField.elem,
                this.personField.elem,
            ]),
            window.app.createContainer(`${FORM_COLUMN_CLASS} ${AMOUNT_COLUMN_CLASS}`, [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            window.app.createContainer(FORM_COLUMN_CLASS, [
                this.topRow,
            ]),
        ]);

        this.controls = window.app.createContainer(CONTROLS_CLASS, [
            this.delBtn,
        ]);

        this.mainContainer = window.app.createContainer(MAIN_CONTENT_CLASS, [
            this.enableCheck.elem,
            this.formContainer,
            this.controls,
        ]);
        this.feedbackElem = ce('div', { className: INV_FEEDBACK_CLASS });
        show(this.feedbackElem, false);

        this.initContainer(CONTAINER_CLASS, [
            this.mainContainer,
            this.feedbackElem,
        ]);

        this.render();
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

        const selectElem = ce('select');
        this.trTypeField = Field.create({
            title: 'Type',
            content: selectElem,
        });

        this.typeDropDown = DropDown.create({
            elem: selectElem,
            onchange: (type) => this.onTrTypeChanged(type),
        });
        typeItems.forEach((typeItem) => {
            this.typeDropDown.addItem(typeItem);
            if (typeItem.disabled) {
                this.typeDropDown.enableItem(typeItem.id, false);
            }
        });
    }

    /** Create destination(second) account field */
    createAccountField() {
        const selectElem = ce('select');
        this.transferAccountField = Field.create({
            title: TITLE_FIELD_DEST_ACCOUNT,
            content: selectElem,
        });

        this.transferAccDropDown = DropDown.create({
            elem: selectElem,
            disabled: true,
            onchange: (account) => this.onTransferAccountChanged(account),
        });
        window.app.initAccountsList(this.transferAccDropDown);
    }

    /** Create person field */
    createPersonField() {
        const selectElem = ce('select');
        this.personField = Field.create({
            title: TITLE_FIELD_PERSON,
            content: selectElem,
        });

        this.personDropDown = DropDown.create({
            elem: selectElem,
            disabled: true,
            onchange: (person) => this.onPersonChanged(person),
        });
        window.app.initPersonsList(this.personDropDown);
    }

    /** Create source amount field */
    createSourceAmountField() {
        this.srcAmountInp = ce('input', {
            className: `${IG_INPUT_CLASS} ${DEFAULT_INPUT_CLASS} ${AMOUNT_INPUT_CLASS}`,
            type: 'text',
            name: 'src_amount[]',
            disabled: true,
            placeholder: TITLE_FIELD_AMOUNT,
            autocomplete: 'off',
        });
        this.srcAmountDecimalInput = DecimalInput.create({
            elem: this.srcAmountInp,
            digits: 2,
            oninput: () => this.onSrcAmountInput(),
        });

        this.srcCurrencySign = ce('div', { className: IG_BUTTON_TITLE_CLASS });
        this.srcCurrencyBtn = ce('button', {
            type: 'button',
            className: IG_BUTTON_CLASS,
            tabIndex: -1,
        }, this.srcCurrencySign);

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
            className: AMOUNT_FIELD_CLASS,
        });
    }

    /** Create destination amount field */
    createDestAmountField() {
        this.destAmountInp = ce('input', {
            className: `${IG_INPUT_CLASS} ${DEFAULT_INPUT_CLASS} ${AMOUNT_INPUT_CLASS}`,
            type: 'text',
            name: 'dest_amount[]',
            placeholder: TITLE_FIELD_DEST_AMOUNT,
            autocomplete: 'off',
        });
        this.destAmountDecimalInput = DecimalInput.create({
            elem: this.destAmountInp,
            digits: 2,
            oninput: () => this.onDestAmountInput(),
        });

        this.destCurrencySign = ce('div', { className: IG_BUTTON_TITLE_CLASS });
        this.destCurrencyBtn = ce('button', {
            type: 'button',
            className: IG_BUTTON_CLASS,
            tabIndex: -1,
        }, this.destCurrencySign);

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
            className: AMOUNT_FIELD_CLASS,
        });
        this.destAmountField.hide();
    }

    /** Create date field */
    createDateField() {
        this.dateInp = ce('input', {
            className: `${DEFAULT_INPUT_CLASS} ${IG_INPUT_CLASS}`,
            type: 'text',
            name: 'date[]',
            placeholder: TITLE_FIELD_DATE,
            autocomplete: 'off',
        }, null, { input: () => this.onDateInput() });

        const dateIcon = window.app.createIcon(
            'calendar-icon',
            `${DEFAULT_ICON_CLASS} ${CALENDAR_ICON_CLASS}`,
        );
        this.dateBtn = ce('button', {
            type: 'button',
            className: IG_BUTTON_CLASS,
        }, dateIcon, { click: () => this.showDatePicker() });

        this.dateGroup = InputGroup.create({
            children: [this.dateInp, this.dateBtn],
        });
        this.dateField = Field.create({
            title: TITLE_FIELD_DATE,
            content: this.dateGroup.elem,
            className: DATE_FIELD_CLASS,
        });
    }

    /** Transaction type select 'change' event handler */
    onTrTypeChanged(type) {
        this.setTransactionType(type.id);
        this.clearInvalid();
        this.render();
    }

    /** Destination account select 'change' event handler */
    onTransferAccountChanged(account) {
        this.setTransferAccount(account.id);
        this.clearInvalid();
        this.render();
    }

    /** Person select 'change' event handler */
    onPersonChanged(person) {
        this.setPerson(person.id);
        this.clearInvalid();
        this.render();
    }

    /** Source amount field 'input' event handler */
    onSrcAmountInput() {
        const { value } = this.srcAmountInp;
        this.setSourceAmount(value);
        this.clearInvalid();
        this.render();
    }

    /** Destination amount field 'input' event handler */
    onDestAmountInput() {
        const { value } = this.destAmountInp;
        this.setDestAmount(value);
        this.clearInvalid();
        this.render();
    }

    /** Currency select 'change' event handler */
    onSrcCurrChanged(currency) {
        this.setSourceCurrency(currency.id);
        this.clearInvalid();
        this.render();
    }

    /** Currency select 'change' event handler */
    onDestCurrChanged(currency) {
        this.setDestCurrency(currency.id);
        this.clearInvalid();
        this.render();
    }

    /** Date field 'input' event handler */
    onDateInput() {
        const { value } = this.dateInp;
        this.setDate(value);
        this.clearInvalid();
        this.render();
    }

    /** DatePicker select event handler */
    onDateSelect(date) {
        const dateFmt = window.app.formatDate(date);
        this.setDate(dateFmt);
        this.datePicker.hide();
        this.clearInvalid();
        this.render();
    }

    /** Comment field 'input' event handler */
    onCommentInput() {
        const { value } = this.commInp;
        this.setComment(value);
        this.clearInvalid();
        this.render();
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

        if (state.type === 'expense') {
            const destAmountValid = this.validateDestAmount(state);
            if (!destAmountValid) {
                return false;
            }
            if (state.isDiff) {
                const srcAmountValid = this.validateSourceAmount(state);
                if (!srcAmountValid) {
                    return false;
                }
            }
        } else {
            const srcAmountValid = this.validateSourceAmount(state);
            if (!srcAmountValid) {
                return false;
            }
            if (state.isDiff) {
                const destAmountValid = this.validateDestAmount(state);
                if (!destAmountValid) {
                    return false;
                }
            }
        }

        if (!checkDate(state.date)) {
            window.app.invalidateBlock(this.dateField.elem);
            this.setFeedback(MSG_INVALID_DATE);
            return false;
        }

        return true;
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

    /** Render component */
    render() {
        const { state } = this;

        if (!state) {
            throw new Error('Invalid state');
        }

        const isIncome = state.type === 'income';
        const isTransfer = ['transferfrom', 'transferto'].includes(state.type);
        const isDebt = ['debtfrom', 'debtto'].includes(state.type);

        enable(this.elem, state.enabled);

        this.enableCheck.check(state.enabled);

        // Type field
        this.typeDropDown.enable(state.enabled);
        this.typeDropDown.selectItem(state.type);

        // Amount field
        if (state.type === 'expense') {
            // Destination amount field
            this.destAmountInp.value = state.destAmount;
            enable(this.destAmountInp, state.enabled);
            this.destCurrencyDropDown.enable(state.enabled);
            enable(this.destCurrencyBtn, state.enabled);
            this.renderCurrency(this.destCurrencySign, this.destCurrencyDropDown, state.destCurrId);
            this.destAmountField.show();

            const destAmountLabel = (state.isDiff) ? TITLE_FIELD_DEST_AMOUNT : TITLE_FIELD_AMOUNT;
            this.destAmountInp.placeholder = destAmountLabel;
            this.destAmountField.setTitle(destAmountLabel);

            // Source amount field
            this.srcAmountInp.value = state.sourceAmount;
            enable(this.srcAmountInp, state.enabled && state.isDiff);
            this.srcCurrencyDropDown.enable(false);
            enable(this.srcCurrencyBtn, false);
            this.renderCurrency(this.srcCurrencySign, this.srcCurrencyDropDown, state.srcCurrId);
            this.srcAmountField.show(state.isDiff);

            this.srcAmountInp.placeholder = TITLE_FIELD_SRC_AMOUNT;
            this.srcAmountField.setTitle(TITLE_FIELD_SRC_AMOUNT);
        } else {
            // Source amount field
            this.srcAmountInp.value = state.sourceAmount;
            enable(this.srcAmountInp, state.enabled);
            this.srcCurrencyDropDown.enable(state.enabled && isIncome);
            enable(this.srcCurrencyBtn, state.enabled && isIncome);
            this.renderCurrency(this.srcCurrencySign, this.srcCurrencyDropDown, state.srcCurrId);
            this.srcAmountField.show();

            const srcAmountLabel = (state.isDiff) ? TITLE_FIELD_SRC_AMOUNT : TITLE_FIELD_AMOUNT;
            this.srcAmountInp.placeholder = srcAmountLabel;
            this.srcAmountField.setTitle(srcAmountLabel);

            // Destination amount field
            this.destAmountInp.value = state.destAmount;
            enable(this.destAmountInp, state.enabled && state.isDiff);
            this.destCurrencyDropDown.enable(false);
            enable(this.destCurrencyBtn, false);
            this.renderCurrency(this.destCurrencySign, this.destCurrencyDropDown, state.destCurrId);
            this.destAmountField.show(state.isDiff);

            this.destAmountInp.placeholder = TITLE_FIELD_DEST_AMOUNT;
            this.destAmountField.setTitle(TITLE_FIELD_DEST_AMOUNT);
        }

        // Second account field
        this.transferAccDropDown.enable(state.enabled && isTransfer);
        if (isTransfer) {
            const strMainAccountId = state.mainAccount.id.toString();
            const accountItems = this.transferAccDropDown.getVisibleItems();
            accountItems.forEach((accountItem) => this.transferAccDropDown.enableItem(
                accountItem.id,
                accountItem.id !== strMainAccountId,
            ));

            const transferAccountId = (state.type === 'transferto')
                ? state.sourceAccountId
                : state.destAccountId;
            if (transferAccountId) {
                this.transferAccDropDown.selectItem(transferAccountId);
            }

            const accountLabel = (state.type === 'transferto')
                ? TITLE_FIELD_SRC_ACCOUNT
                : TITLE_FIELD_DEST_ACCOUNT;
            this.transferAccountField.setTitle(accountLabel);
        }
        this.transferAccountField.show(isTransfer);

        // Person field
        this.personDropDown.enable(state.enabled && isDebt);
        if (state.personId) {
            this.personDropDown.selectItem(state.personId);
        }
        this.personField.show(isDebt);

        // Date field
        enable(this.dateBtn, state.enabled);
        enable(this.dateInp, state.enabled);
        this.dateInp.value = state.date;

        // Commend field
        enable(this.commInp, state.enabled);
        this.commInp.value = state.comment;
    }
}
