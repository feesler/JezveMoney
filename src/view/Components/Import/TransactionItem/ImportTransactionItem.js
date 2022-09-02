import {
    ce,
    re,
    show,
    enable,
    copyObject,
    isFunction,
    addChilds,
    removeChilds,
    formatDate,
    Component,
    Checkbox,
} from 'jezvejs';
import { fixFloat } from '../../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../js/model/Transaction.js';
import './style.scss';
import { Field } from '../Field/Field.js';

/** CSS classes */
const CONTAINER_CLASS = 'import-item';
const EXPANDED_CLASS = 'import-item--expanded';
const MAIN_CONTENT_CLASS = 'main-content';
const EXT_CONTENT_CLASS = 'extended-content';
const ITEM_CONTAINER_CLASS = 'item-container';
const COLUMN_CLASS = 'item-column';
const ROW_CLASS = 'item-row';
const AMOUNT_COLUMN_CLASS = 'amount-col';
const TYPE_COLUMN_CLASS = 'type-col';
/* Fields */
const TYPE_FIELD_CLASS = 'type-field';
const ACCOUNT_FIELD_CLASS = 'account-field';
const PERSON_FIELD_CLASS = 'person-field';
const AMOUNT_FIELD_CLASS = 'amount-field';
const DATE_FIELD_CLASS = 'date-field';
const COMMENT_FIELD_CLASS = 'comment-field';
/* Field values */
const TYPE_CLASS = 'import-item__type';
const ACCOUNT_CLASS = 'import-item__account';
const PERSON_CLASS = 'import-item__person';
const AMOUNT_CLASS = 'import-item__amount';
const DATE_CLASS = 'import-item__date';
const COMMENT_CLASS = 'import-item__comment';
/* Controls */
const ENABLE_CHECK_CLASS = 'enable-check';
const CONTROLS_CLASS = 'controls';
const DEFAULT_BUTTON_CLASS = 'btn';
const UPDATE_BUTTON_CLASS = 'update-btn';
const DEL_BUTTON_CLASS = 'delete-btn';
const TOGGLE_BUTTON_CLASS = 'toggle-btn';
const DEFAULT_ICON_CLASS = 'icon';
const UPDATE_ICON_CLASS = 'update-icon';
const DEL_ICON_CLASS = 'delete-icon';
const TOGGLE_ICON_CLASS = 'toggle-icon';
/* Original data */
const DATA_VALUE_CLASS = 'data-value';
const ORIG_DATA_CLASS = 'orig-data';
const ORIG_DATA_TABLE_CLASS = 'orig-data-table';
const COMMENT_VALUE_CLASS = 'comment-value';

/** Strings */
const TITLE_FIELD_SRC_ACCOUNT = 'Source account';
const TITLE_FIELD_DEST_ACCOUNT = 'Destination account';
const TITLE_FIELD_AMOUNT = 'Amount';
const TITLE_FIELD_SRC_AMOUNT = 'Source amount';
/** Original data table */
const TITLE_ORIGINAL_DATA = 'Original imported data';
const COL_MAIN = 'Main account';
const COL_DATE = 'Date';
const COL_COMMENT = 'Comment';
const COL_TR_AMOUNT = 'Tr. amount';
const COL_TR_CURRENCY = 'Tr. currency';
const COL_ACC_AMOUNT = 'Acc. amount';
const COL_ACC_CURRENCY = 'Acc. currency';

const typeStrings = {
    expense: 'Expense',
    income: 'Income',
    transferfrom: 'Transfer from',
    transferto: 'Transfer to',
    debtfrom: 'Debt from',
    debtto: 'Debt to',
};
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
    sourceAmount: 0,
    destAmount: 0,
    personId: 0,
    date: formatDate(new Date()),
    comment: '',
    onUpdate: null,
    onEnable: null,
    onRemove: null,
};

/**
 * ImportTransactionForm component
 */
export class ImportTransactionItem extends Component {
    static create(props) {
        return new ImportTransactionItem(props);
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
        } else {
            state.destAccountId = mainAccount.id;
            state.destCurrId = mainAccount.curr_id;
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

        this.trTypeTitle = ce('span', { className: TYPE_CLASS });
        this.trTypeField = Field.create({
            title: 'Type',
            content: this.trTypeTitle,
            className: TYPE_FIELD_CLASS,
        });

        this.accountTitle = ce('span', { className: ACCOUNT_CLASS });
        this.accountField = Field.create({
            title: 'Account',
            content: this.accountTitle,
            className: ACCOUNT_FIELD_CLASS,
        });

        this.personTitle = ce('span', { className: PERSON_CLASS });
        this.personField = Field.create({
            title: 'Person',
            content: this.personTitle,
            className: PERSON_FIELD_CLASS,
        });

        this.srcAmountTitle = ce('span', { className: AMOUNT_CLASS });
        this.srcAmountField = Field.create({
            title: 'Amount',
            content: this.srcAmountTitle,
            className: AMOUNT_FIELD_CLASS,
        });

        this.destAmountTitle = ce('span', { className: AMOUNT_CLASS });
        this.destAmountField = Field.create({
            title: 'Destination amount',
            content: this.destAmountTitle,
            className: AMOUNT_FIELD_CLASS,
        });

        this.dateTitle = ce('span', { className: DATE_CLASS });
        this.dateField = Field.create({
            title: 'Date',
            content: this.dateTitle,
            className: DATE_FIELD_CLASS,
        });

        this.commentTitle = ce('span', { className: COMMENT_CLASS });
        this.commentField = Field.create({
            title: 'Comment',
            content: this.commentTitle,
            className: COMMENT_FIELD_CLASS,
        });

        // Update button
        this.updateBtn = ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${UPDATE_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('update', `${DEFAULT_ICON_CLASS} ${UPDATE_ICON_CLASS}`),
            { click: () => this.onUpdate() },
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

        this.topRow = window.app.createContainer(ROW_CLASS, [
            this.dateField.elem,
            this.commentField.elem,
        ]);

        this.itemContainer = window.app.createContainer(ITEM_CONTAINER_CLASS, [
            window.app.createContainer(`${COLUMN_CLASS} ${TYPE_COLUMN_CLASS}`, [
                this.trTypeField.elem,
                this.accountField.elem,
                this.personField.elem,
            ]),
            window.app.createContainer(`${COLUMN_CLASS} ${AMOUNT_COLUMN_CLASS}`, [
                this.srcAmountField.elem,
                this.destAmountField.elem,
            ]),
            window.app.createContainer(COLUMN_CLASS, [
                this.topRow,
            ]),
        ]);

        this.mainContainer = window.app.createContainer(MAIN_CONTENT_CLASS, [
            this.enableCheck.elem,
            this.itemContainer,
            window.app.createContainer(CONTROLS_CLASS, [
                this.updateBtn,
                this.delBtn,
                this.toggleExtBtn,
            ]),
        ]);

        this.elem = window.app.createContainer(CONTAINER_CLASS, [
            this.mainContainer,
        ]);

        const { originalData } = this.props;
        if (originalData) {
            this.extendedContainer = window.app.createContainer(EXT_CONTENT_CLASS);
            this.elem.append(this.extendedContainer);
            this.setExtendedContent(
                this.createOrigDataContainer(originalData, this.state.mainAccount),
            );
        }

        this.render();
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

    /** Update button 'click' event handler */
    onUpdate() {
        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate(this);
        }
    }

    /** Main account of transaction select 'change' event handler */
    onMainAccountChanged(value) {
        this.setMainAccount(value);
        this.render();
    }

    /** Check currencies is different and return new state */
    checkStateCurrencies(state) {
        const res = {
            ...state,
            isDiff: state.srcCurrId !== state.destCurrId,
        };

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

    /** Render component */
    render(state = this.state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const { userAccounts, persons, currency } = window.app.model;
        const isTransfer = ['transferfrom', 'transferto'].includes(state.type);
        const isDebt = ['debtfrom', 'debtto'].includes(state.type);

        enable(this.elem, state.enabled);

        this.enableCheck.check(state.enabled);

        // Types field
        if (!(state.type in typeStrings)) {
            throw new Error('Invalid transaction type');
        }
        this.trTypeTitle.textContent = typeStrings[state.type];

        // Account field
        this.accountField.show(isTransfer);
        if (isTransfer) {
            const isTransferFrom = state.type === 'transferfrom';
            const accountId = (isTransferFrom) ? state.destAccountId : state.sourceAccountId;
            const account = userAccounts.getItem(accountId);
            this.accountTitle.textContent = account.name;

            const accountTitle = (isTransferFrom)
                ? TITLE_FIELD_DEST_ACCOUNT
                : TITLE_FIELD_SRC_ACCOUNT;
            this.accountField.setTitle(accountTitle);
        }
        // Person field
        this.personField.show(isDebt);
        if (isDebt) {
            const person = persons.getItem(state.personId);
            this.personTitle.textContent = person.name;
        }

        // Amount fields
        const srcAmountLabel = (state.isDiff) ? TITLE_FIELD_SRC_AMOUNT : TITLE_FIELD_AMOUNT;
        this.srcAmountField.setTitle(srcAmountLabel);
        const srcAmount = currency.formatCurrency(state.sourceAmount, state.srcCurrId);
        this.srcAmountTitle.textContent = srcAmount;

        this.destAmountField.show(state.isDiff);
        if (state.isDiff) {
            const destAmount = currency.formatCurrency(state.destAmount, state.destCurrId);
            this.destAmountTitle.textContent = destAmount;
        }

        // Date field
        this.dateTitle.textContent = state.date;

        // Comment field
        this.commentTitle.textContent = state.comment;
    }
}
