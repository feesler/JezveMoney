import {
    ce,
    re,
    show,
    enable,
    checkDate,
    copyObject,
    isFunction,
    addChilds,
    removeChilds,
    formatDate,
    Component,
    Checkbox,
    DropDown,
    DecimalInput,
    InputGroup,
} from 'jezvejs';
import { fixFloat } from '../../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../js/model/Transaction.js';
import './style.scss';

/** CSS classes */
const CONTAINER_CLASS = 'import-form';
const EXPANDED_CLASS = 'import-form--expanded';
const ENABLE_CHECK_CLASS = 'enable-check';
const MAIN_CONTENT_CLASS = 'main-content';
const INV_FEEDBACK_CLASS = 'invalid-feedback';
const EXT_CONTENT_CLASS = 'extended-content';
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
const TOGGLE_BUTTON_CLASS = 'toggle-btn';
const DEFAULT_ICON_CLASS = 'icon';
const DEL_ICON_CLASS = 'delete-icon';
const TOGGLE_ICON_CLASS = 'toggle-icon';
/* Original data */
const DATA_VALUE_CLASS = 'data-value';
const ORIG_DATA_CLASS = 'orig-data';
const ORIG_DATA_TABLE_CLASS = 'orig-data-table';
const COMMENT_VALUE_CLASS = 'comment-value';

/** Fields */
const TITLE_FIELD_AMOUNT = 'Amount';
const TITLE_FIELD_SRC_AMOUNT = 'Source amount';
const TITLE_FIELD_DEST_AMOUNT = 'Destination amount';
const TITLE_FIELD_DATE = 'Date';
const TITLE_FIELD_COMMENT = 'Comment';
const TITLE_FIELD_SRC_ACCOUNT = 'Source account';
const TITLE_FIELD_DEST_ACCOUNT = 'Destination account';
const TITLE_FIELD_PERSON = 'Person';
/** Original data table */
const TITLE_ORIGINAL_DATA = 'Original imported data';
const COL_MAIN = 'Main account';
const COL_DATE = 'Date';
const COL_COMMENT = 'Comment';
const COL_TR_AMOUNT = 'Tr. amount';
const COL_TR_CURRENCY = 'Tr. currency';
const COL_ACC_AMOUNT = 'Acc. amount';
const COL_ACC_CURRENCY = 'Acc. currency';
/** Validation messages */
const MSG_INCORRECT_AMOUNT = 'Please input correct amount';
const MSG_INVALID_DATE = 'Please input correct date';

const transTypeMap = {
    expense: EXPENSE,
    income: INCOME,
    transferfrom: TRANSFER,
    transferto: TRANSFER,
    debtfrom: DEBT,
    debtto: DEBT,
};
const sourceTypes = ['expense', 'transferfrom', 'debtfrom'];

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
    date: formatDate(new Date()),
    comment: '',
    onEnable: null,
    onRemove: null,
};

/**
 * ImportTransactionForm component
 */
export class ImportTransactionForm extends Component {
    static create(props) {
        return new ImportTransactionForm(props);
    }

    constructor(...args) {
        super(...args);

        if (
            !this.parent
            || !this.props
            || !this.props.mainAccount
        ) {
            throw new Error('Invalid props');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        const { mainAccount } = this.props;

        const state = {
            mainAccount,
            ...this.props,
        };
        delete state.parent;
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

        // Date field
        this.dateInp = ce('input', {
            className: DEFAULT_INPUT_CLASS,
            type: 'text',
            name: 'date[]',
            placeholder: TITLE_FIELD_DATE,
            autocomplete: 'off',
        }, null, { input: () => this.onDateInput() });
        this.dateField = window.app.createField(TITLE_FIELD_DATE, this.dateInp, DATE_FIELD_CLASS);
        // Comment field
        this.commInp = ce('input', {
            className: DEFAULT_INPUT_CLASS,
            type: 'text',
            name: 'comment[]',
            placeholder: TITLE_FIELD_COMMENT,
            autocomplete: 'off',
        }, null, { input: () => this.onCommentInput() });
        this.commentField = window.app.createField(
            TITLE_FIELD_COMMENT,
            this.commInp,
            COMMENT_FIELD_CLASS,
        );
        // Delete button
        this.delBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${DEL_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('del', `${DEFAULT_ICON_CLASS} ${DEL_ICON_CLASS}`),
            { click: () => this.remove() },
        );
        // Toggle expand/collapse
        this.toggleExtBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${TOGGLE_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('toggle-ext', `${DEFAULT_ICON_CLASS} ${TOGGLE_ICON_CLASS}`),
            { click: () => this.toggleCollapse() },
        );
        show(this.toggleExtBtn, false);

        this.topRow = window.app.createContainer(FORM_ROW_CLASS, [
            this.dateField,
            this.commentField,
        ]);

        this.formContainer = window.app.createContainer(FORM_CONTAINER_CLASS, [
            window.app.createContainer(`${FORM_COLUMN_CLASS} ${TYPE_COLUMN_CLASS}`, [
                this.trTypeField,
                this.transferAccountField,
                this.personField,
            ]),
            window.app.createContainer(`${FORM_COLUMN_CLASS} ${AMOUNT_COLUMN_CLASS}`, [
                this.srcAmountField,
                this.destAmountField,
            ]),
            window.app.createContainer(FORM_COLUMN_CLASS, [
                this.topRow,
            ]),
        ]);

        this.mainContainer = window.app.createContainer(MAIN_CONTENT_CLASS, [
            this.enableCheck.elem,
            this.formContainer,
            window.app.createContainer(CONTROLS_CLASS, [
                this.delBtn,
                this.toggleExtBtn,
            ]),
        ]);
        this.feedbackElem = ce('div', { className: INV_FEEDBACK_CLASS });
        show(this.feedbackElem, false);
        this.extendedContainer = window.app.createContainer(EXT_CONTENT_CLASS);

        this.elem = window.app.createContainer(CONTAINER_CLASS, [
            this.mainContainer,
            this.feedbackElem,
            this.extendedContainer,
        ]);

        const { originalData } = this.props;
        if (originalData) {
            this.setExtendedContent(
                this.createOrigDataContainer(originalData, this.state.mainAccount),
            );
        }

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
        this.trTypeField = window.app.createField('Type', selectElem);

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
        this.transferAccountField = window.app.createField(TITLE_FIELD_DEST_ACCOUNT, selectElem);
        this.transferAccountLabel = this.transferAccountField.querySelector('label');

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
        this.personField = window.app.createField(TITLE_FIELD_PERSON, selectElem);

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
        this.srcAmountField = window.app.createField(
            TITLE_FIELD_AMOUNT,
            this.srcAmountGroup.elem,
            AMOUNT_FIELD_CLASS,
        );
        this.srcAmountLabel = this.srcAmountField.querySelector('label');
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

        this.destAmountField = window.app.createField(
            TITLE_FIELD_DEST_AMOUNT,
            this.destAmountGroup.elem,
            AMOUNT_FIELD_CLASS,
        );
        show(this.destAmountField, false);
        this.destAmountLabel = this.destAmountField.querySelector('label');
    }

    /** Create static data value element */
    createDataValue(title, value, extraClass) {
        const elemClasses = [DATA_VALUE_CLASS];

        if (typeof extraClass === 'string' && extraClass.length > 0) {
            elemClasses.push(extraClass);
        }

        return ce('div', { className: elemClasses.join(' ') }, [
            ce('label', { textContent: title }),
            ce('div', { textContent: value }),
        ]);
    }

    /**
     * Create set of static data values for original transaction data
     * @param {Object} data - import transaction object
     */
    createOrigDataContainer(data, mainAccount) {
        if (!data || !mainAccount) {
            throw new Error('Invalid data');
        }

        const dataTable = [
            [COL_MAIN, mainAccount.name],
            [COL_DATE, formatDate(new Date(data.date))],
            [COL_TR_AMOUNT, data.transactionAmount],
            [COL_TR_CURRENCY, data.transactionCurrency],
            [COL_ACC_AMOUNT, data.accountAmount],
            [COL_ACC_CURRENCY, data.accountCurrency],
            [COL_COMMENT, data.comment, COMMENT_VALUE_CLASS],
        ];

        return window.app.createContainer(ORIG_DATA_CLASS, [
            ce('h3', { textContent: TITLE_ORIGINAL_DATA }),
            window.app.createContainer(
                ORIG_DATA_TABLE_CLASS,
                dataTable.map((col) => this.createDataValue(...col)),
            ),
        ]);
    }

    /**
     * Setup extended content of item
     * If value is null content is removed and toggle button hidden
     * @param {Element|null} content - value to set extended content
     */
    setExtendedContent(content) {
        removeChilds(this.extendedContainer);

        if (content) {
            addChilds(this.extendedContainer, content);
        } else {
            this.elem.classList.remove(EXPANDED_CLASS);
        }

        show(this.toggleExtBtn, content);
    }

    /** Save original import data */
    saveOriginal(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        if (data !== this.data) {
            this.data = copyObject(data);
            this.data.origAccount = { ...this.state.mainAccount };
        }
        this.data.mainAccount = this.state.mainAccount.id;
    }

    /** Apply import data to component */
    setOriginal(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        if (data.accountCurrencyId !== this.state.mainAccount.curr_id) {
            throw new Error('Currency must be the same as main account');
        }

        const accAmount = parseFloat(fixFloat(data.accountAmount));
        if (Number.isNaN(accAmount) || accAmount === 0) {
            throw new Error('Invalid account amount value');
        }
        const trAmount = parseFloat(fixFloat(data.transactionAmount));
        if (Number.isNaN(trAmount) || trAmount === 0) {
            throw new Error('Invalid transaction amount value');
        }

        if (accAmount > 0) {
            this.invertTransactionType();
        }

        if (this.state.type === 'expense') {
            this.setDestAmount(Math.abs(trAmount));
            this.setDestCurrency(data.transactionCurrencyId);
            this.setSourceAmount(Math.abs(accAmount));
        } else if (this.state.type === 'income') {
            this.setSourceAmount(Math.abs(trAmount));
            this.setSourceCurrency(data.transactionCurrencyId);
            this.setDestAmount(Math.abs(accAmount));
        }

        this.setDate(formatDate(new Date(data.date)));
        this.setComment(data.comment);
    }

    /** Restore original data */
    restoreOriginal() {
        const currentMainAccount = this.data.mainAccount;

        this.setTransactionType('expense');
        this.setMainAccount(this.data.origAccount.id);
        this.setDestCurrency(this.data.origAccount.curr_id);
        this.setSourceAmount(0);

        this.setOriginal(this.data);

        this.setMainAccount(currentMainAccount);
    }

    /** Remove item */
    remove() {
        if (isFunction(this.props.onRemove)) {
            this.props.onRemove(this);
        }

        re(this.elem);
    }

    /** Enable checkbox 'change' event handler */
    onRowChecked() {
        const value = this.enableCheck.checked;
        this.enable(value);
        this.render();

        if (isFunction(this.props.onEnable)) {
            this.props.onEnable(this, value);
        }
    }

    /** Toggle collapse/expand button 'click' event handler */
    toggleCollapse() {
        this.elem.classList.toggle(EXPANDED_CLASS);
    }

    /**
     * Enable/disable component
     * @param {boolean} val - if true then enables component, else disable
     */
    enable(value) {
        const res = !!value;

        if (this.state.enabled === res) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.enabled = res;

        this.state = state;
        return state;
    }

    /** Main account of transaction select 'change' event handler */
    onMainAccountChanged(value) {
        this.setMainAccount(value);
        this.render();
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

    /** Synchronize options of transfer account select */
    syncTransferAccountSelect(state) {
        const accountItems = this.transferAccDropDown.getVisibleItems();
        accountItems.forEach((accountItem) => {
            const isMainAccount = accountItem.id === state.accountId;
            this.transferAccDropDown.enableItem(accountItem.id, !isMainAccount);
        });
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

    /** Comment field 'input' event handler */
    onCommentInput() {
        const { value } = this.commInp;
        this.setComment(value);
        this.clearInvalid();
        this.render();
    }

    /** Check currencies is different and return new state */
    checkStateCurrencies(state) {
        const res = {
            ...state,
            isDiff: state.srcCurrId !== state.destCurrId,
        };

        if (!res.isDiff) {
            if (res.type === 'expense') {
                res.sourceAmount = '';
            } else {
                res.destAmount = '';
            }
        }

        return res;
    }

    getTransferAccount(state, initialId) {
        const { userAccounts } = window.app.model;

        let res = userAccounts.getItem(initialId);
        if (!res) {
            res = userAccounts.getNextAccount();
        }
        if (res.id === state.mainAccount.id) {
            res = userAccounts.getNextAccount(res.id);
        }

        return res;
    }

    /** Set type of transaction */
    setTransactionType(value) {
        if (typeof value !== 'string' || !(value in transTypeMap)) {
            throw new Error('Invalid transaction type');
        }

        if (this.state.type === value) {
            return this.state;
        }

        const state = copyObject(this.state);
        if (sourceTypes.includes(value)) {
            state.sourceAccountId = state.mainAccount.id;
            state.srcCurrId = state.mainAccount.curr_id;
        } else {
            state.destAccountId = state.mainAccount.id;
            state.destCurrId = state.mainAccount.curr_id;
        }

        if (value === 'expense') {
            state.personId = 0;
            state.destAccountId = 0;
            // Copy source amount to destination amount if previous type was
            // not income with different currencies
            if (!(state.type === 'income' && state.isDiff)) {
                state.destAmount = this.state.sourceAmount;
                state.destCurrId = state.mainAccount.curr_id;
            }
            // Keep previous currencies from income
            if (state.type === 'income') {
                state.destCurrId = this.state.srcCurrId;
            }
        } else if (value === 'income') {
            state.personId = 0;
            state.sourceAccountId = 0;
            // Copy destination amount to source amount
            // if previous type was expense with same currencies
            if (state.type === 'expense' && !state.isDiff) {
                state.sourceAmount = this.state.destAmount;
            }
            // Keep currencies from expense
            if (state.type === 'expense') {
                state.srcCurrId = this.state.destCurrId;
            }
            // Set source currency same as main account if currencies was the same or
            // previous type was not expense
            if (state.type !== 'expense' || !state.isDiff) {
                state.srcCurrId = state.mainAccount.curr_id;
            }
        } else if (value === 'transferfrom') {
            state.personId = 0;
            // Copy destination amount to source amount
            // if previous type was expense
            if (state.type === 'expense') {
                state.sourceAmount = this.state.destAmount;
            }

            const account = this.getTransferAccount(state, this.state.destAccountId);
            state.destAccountId = account.id;
            state.destCurrId = account.curr_id;
        } else if (value === 'transferto') {
            state.personId = 0;
            // Copy destination amount to source amount
            // if previous type was expense
            if (state.type === 'expense') {
                state.sourceAmount = this.state.destAmount;
            }

            const account = this.getTransferAccount(state, this.state.sourceAccountId);
            state.sourceAccountId = account.id;
            state.srcCurrId = account.curr_id;
        } else if (value === 'debtfrom' || value === 'debtto') {
            // Copy destination amount to source amount
            // if previous type was expense
            if (state.type === 'expense') {
                state.sourceAmount = this.state.destAmount;
            }

            if (value === 'debtfrom') {
                state.destAccountId = 0;
            } else {
                state.sourceAccountId = 0;
            }

            if (!state.personId) {
                const person = window.app.model.persons.getItemByIndex(0);
                if (!person) {
                    throw new Error('Person not found');
                }
                state.personId = person.id;
            }
            state.srcCurrId = state.mainAccount.curr_id;
            state.destCurrId = state.mainAccount.curr_id;
        }
        state.type = value;

        const res = this.checkStateCurrencies(state);
        this.state = res;
        return res;
    }

    /** Invert type of transaction */
    invertTransactionType() {
        const trType = this.state.type;

        let typeValue;
        if (trType === 'expense') {
            typeValue = 'income';
        } else if (trType === 'income') {
            typeValue = 'expense';
        } else if (trType === 'transferfrom') {
            typeValue = 'transferto';
        } else if (trType === 'transferto') {
            typeValue = 'transferfrom';
        } else if (trType === 'debtto') {
            typeValue = 'debtfrom';
        } else if (trType === 'debtfrom') {
            typeValue = 'debtto';
        }

        return this.setTransactionType(typeValue);
    }

    /** Set source currency */
    setSourceCurrency(value) {
        if (this.state.type !== 'income') {
            throw new Error('Invalid state');
        }

        const selectedCurr = parseInt(value, 10);
        if (Number.isNaN(selectedCurr)) {
            throw new Error('Invalid currency selected');
        }

        if (this.state.srcCurrId === selectedCurr) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.srcCurrId = selectedCurr;

        const res = this.checkStateCurrencies(state);
        this.state = res;
        return res;
    }

    /** Set destination currency */
    setDestCurrency(value) {
        if (this.state.type !== 'expense') {
            throw new Error('Invalid state');
        }

        const selectedCurr = parseInt(value, 10);
        if (Number.isNaN(selectedCurr)) {
            throw new Error('Invalid currency selected');
        }

        if (this.state.destCurrId === selectedCurr) {
            return this.state;
        }
        const state = copyObject(this.state);

        state.destCurrId = selectedCurr;
        const res = this.checkStateCurrencies(state);
        this.state = res;
        return res;
    }

    /** Set main account */
    setMainAccount(value) {
        const account = window.app.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.state.accountId === account.id) {
            return this.state;
        }
        const state = {
            ...this.state,
            mainAccount: account,
        };

        if (sourceTypes.includes(state.type)) {
            state.sourceAccountId = account.id;
            state.srcCurrId = account.curr_id;
        } else {
            state.destAccountId = account.id;
            state.destCurrId = account.curr_id;
        }

        if (this.data) {
            this.data.mainAccount = account.id;
        }

        if (state.type === 'expense' || state.type === 'income') {
            if (!state.isDiff) {
                if (state.type === 'expense') {
                    state.destCurrId = state.srcCurrId;
                } else {
                    state.srcCurrId = state.destCurrId;
                }
            }
        } else if (state.type === 'transferfrom' || state.type === 'transferto') {
            if (state.sourceAccountId === state.destAccountId) {
                const { userAccounts } = window.app.model;
                const nextAccount = userAccounts.getNextAccount(state.mainAccount.id);
                if (state.type === 'transferfrom') {
                    state.destAccountId = nextAccount.id;
                    state.destCurrId = nextAccount.curr_id;
                } else {
                    state.sourceAccountId = nextAccount.id;
                    state.srcCurrId = nextAccount.curr_id;
                }
            }
        } else if (state.type === 'debtfrom' || state.type === 'debtto') {
            if (state.type === 'debtfrom') {
                state.destCurrId = state.srcCurrId;
            } else {
                state.srcCurrId = state.destCurrId;
            }
        }

        const res = this.checkStateCurrencies(state);
        this.state = res;
        return res;
    }

    /** Set transfer account */
    setTransferAccount(value) {
        const account = window.app.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }
        const transferAccountId = (this.state.type === 'transferfrom')
            ? this.state.destAccountId
            : this.state.sourceAccountId;
        if (transferAccountId === account.id) {
            return this.state;
        }

        // Can't set transfer account same as main account
        if (this.state.mainAccount.id === account.id) {
            throw new Error('Can\'t set second account same as main account');
        }

        const state = {
            ...this.state,
        };
        if (state.type === 'transferfrom') {
            state.destAccountId = account.id;
            state.destCurrId = account.curr_id;
        } else {
            state.sourceAccountId = account.id;
            state.srcCurrId = account.curr_id;
        }

        const res = this.checkStateCurrencies(state);
        this.state = res;
        return res;
    }

    /** Set person */
    setPerson(value) {
        const person = window.app.model.persons.getItem(value);
        if (!person) {
            throw new Error('Person not found');
        }

        if (this.state.personId === person.id) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.personId = person.id;

        this.state = state;

        return state;
    }

    /** Set source amount */
    setSourceAmount(value) {
        const res = parseFloat(fixFloat(value));
        if (Number.isNaN(res)) {
            throw new Error('Invalid amount value');
        }

        if (this.state.sourceAmount === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.sourceAmount = value;

        this.state = state;

        return state;
    }

    /** Set destination amount */
    setDestAmount(value) {
        const res = parseFloat(fixFloat(value));
        if (Number.isNaN(res)) {
            throw new Error('Invalid amount value');
        }

        if (this.state.destAmount === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.destAmount = value;

        this.state = state;

        return state;
    }

    /** Set date */
    setDate(value) {
        if (typeof value === 'undefined') {
            throw new Error('Invalid date value');
        }

        if (this.state.date === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.date = value;

        this.state = state;

        return state;
    }

    /** Set comment */
    setComment(value) {
        if (typeof value !== 'string') {
            throw new Error('Invalid comment value');
        }

        if (this.state.comment === value) {
            return this.state;
        }
        const state = copyObject(this.state);
        state.comment = value;

        this.state = state;

        return state;
    }

    /** Return original data object */
    getOriginal() {
        return this.data;
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
        this.parent.clearBlockValidation(this.srcAmountField);
        this.parent.clearBlockValidation(this.destAmountField);
        this.parent.clearBlockValidation(this.dateField);
        this.setFeedback();
    }

    validateSourceAmount(state) {
        const amountValue = parseFloat(fixFloat(state.sourceAmount));
        if (Number.isNaN(amountValue) || amountValue <= 0) {
            this.parent.invalidateBlock(this.srcAmountField);
            this.setFeedback(MSG_INCORRECT_AMOUNT);
            return false;
        }

        return true;
    }

    validateDestAmount(state) {
        const amountValue = parseFloat(fixFloat(state.destAmount));
        if (Number.isNaN(amountValue) || amountValue <= 0) {
            this.parent.invalidateBlock(this.destAmountField);
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
            this.parent.invalidateBlock(this.dateField);
            this.setFeedback(MSG_INVALID_DATE);
            return false;
        }

        return true;
    }

    /** Return date string */
    getDate() {
        return this.state.date;
    }

    /** Return transaction object */
    getData() {
        const { accounts, persons } = window.app.model;
        const { state } = this;

        const srcAmountVal = parseFloat(fixFloat(state.sourceAmount));
        const destAmountVal = parseFloat(fixFloat(state.destAmount));
        const res = {};

        if (state.type === 'expense') {
            res.type = EXPENSE;
            res.src_id = state.sourceAccountId;
            res.dest_id = 0;
            res.src_curr = state.srcCurrId;
            res.dest_curr = state.destCurrId;
            res.src_amount = (state.isDiff) ? srcAmountVal : destAmountVal;
            res.dest_amount = destAmountVal;
        } else if (state.type === 'income') {
            res.type = INCOME;
            res.src_id = 0;
            res.dest_id = state.destAccountId;
            res.src_curr = state.srcCurrId;
            res.dest_curr = state.destCurrId;
            res.src_amount = srcAmountVal;
            res.dest_amount = (state.isDiff) ? destAmountVal : srcAmountVal;
        } else if (state.type === 'transferfrom') {
            const transferAcc = accounts.getItem(state.destAccountId);
            if (!transferAcc) {
                throw new Error('Invalid transaction: Account not found');
            }

            res.type = TRANSFER;
            res.src_id = state.sourceAccountId;
            res.dest_id = state.destAccountId;
            res.src_curr = state.srcCurrId;
            res.dest_curr = state.destCurrId;
            res.src_amount = srcAmountVal;
            res.dest_amount = (state.isDiff) ? destAmountVal : srcAmountVal;
        } else if (state.type === 'transferto') {
            const transferAcc = accounts.getItem(state.sourceAccountId);
            if (!transferAcc) {
                throw new Error('Invalid transaction: Account not found');
            }

            res.type = TRANSFER;
            res.src_id = state.sourceAccountId;
            res.dest_id = state.destAccountId;
            res.src_curr = state.srcCurrId;
            res.dest_curr = state.destCurrId;
            res.src_amount = srcAmountVal;
            res.dest_amount = (state.isDiff) ? destAmountVal : srcAmountVal;
        } else if (state.type === 'debtfrom' || state.type === 'debtto') {
            const person = persons.getItem(state.personId);
            if (!person) {
                throw new Error('Invalid transaction: Person not found');
            }

            res.type = DEBT;
            res.op = (state.type === 'debtto') ? 1 : 2;
            res.person_id = person.id;
            res.acc_id = state.mainAccount.id;
            res.src_curr = state.srcCurrId;
            res.dest_curr = state.destCurrId;
            res.src_amount = srcAmountVal;
            res.dest_amount = srcAmountVal;
        }

        res.date = state.date;
        res.comment = state.comment;

        return res;
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
            show(this.destAmountField, true);

            const destAmountLabel = (state.isDiff) ? TITLE_FIELD_DEST_AMOUNT : TITLE_FIELD_AMOUNT;
            this.destAmountInp.placeholder = destAmountLabel;
            this.destAmountLabel.textContent = destAmountLabel;

            // Source amount field
            this.srcAmountInp.value = state.sourceAmount;
            enable(this.srcAmountInp, state.enabled && state.isDiff);
            this.srcCurrencyDropDown.enable(false);
            enable(this.srcCurrencyBtn, false);
            this.renderCurrency(this.srcCurrencySign, this.srcCurrencyDropDown, state.srcCurrId);
            show(this.srcAmountField, state.isDiff);

            this.srcAmountInp.placeholder = TITLE_FIELD_SRC_AMOUNT;
            this.srcAmountLabel.textContent = TITLE_FIELD_SRC_AMOUNT;
        } else {
            // Source amount field
            this.srcAmountInp.value = state.sourceAmount;
            enable(this.srcAmountInp, state.enabled);
            this.srcCurrencyDropDown.enable(state.enabled && isIncome);
            enable(this.srcCurrencyBtn, state.enabled && isIncome);
            this.renderCurrency(this.srcCurrencySign, this.srcCurrencyDropDown, state.srcCurrId);
            show(this.srcAmountField, true);

            const srcAmountLabel = (state.isDiff) ? TITLE_FIELD_SRC_AMOUNT : TITLE_FIELD_AMOUNT;
            this.srcAmountInp.placeholder = srcAmountLabel;
            this.srcAmountLabel.textContent = srcAmountLabel;

            // Destination amount field
            this.destAmountInp.value = state.destAmount;
            enable(this.destAmountInp, state.enabled && state.isDiff);
            this.destCurrencyDropDown.enable(false);
            enable(this.destCurrencyBtn, false);
            this.renderCurrency(this.destCurrencySign, this.destCurrencyDropDown, state.destCurrId);
            show(this.destAmountField, state.isDiff);

            this.destAmountInp.placeholder = TITLE_FIELD_DEST_AMOUNT;
            this.destAmountLabel.textContent = TITLE_FIELD_DEST_AMOUNT;
        }

        // Second account field
        this.transferAccDropDown.enable(state.enabled && isTransfer);
        if (isTransfer) {
            this.syncTransferAccountSelect(state);
            const transferAccountId = (state.type === 'transferto')
                ? state.sourceAccountId
                : state.destAccountId;
            if (transferAccountId) {
                this.transferAccDropDown.selectItem(transferAccountId);
            }
            show(this.transferAccountField, true);

            const accountLabel = (state.type === 'transferto')
                ? TITLE_FIELD_SRC_ACCOUNT
                : TITLE_FIELD_DEST_ACCOUNT;

            this.transferAccountLabel.textContent = accountLabel;
        }
        show(this.transferAccountField, isTransfer);

        // Person field
        this.personDropDown.enable(state.enabled && isDebt);
        if (state.personId) {
            this.personDropDown.selectItem(state.personId);
        }
        show(this.personField, isDebt);

        // Date filed
        enable(this.dateInp, state.enabled);
        this.dateInp.value = state.date;

        // Commend field
        enable(this.commInp, state.enabled);
        this.commInp.value = state.comment;
    }
}
