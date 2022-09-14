import {
    ce,
    re,
    copyObject,
    isFunction,
    Component,
    Collapsible,
} from 'jezvejs';
import { fixFloat } from '../../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../js/model/Transaction.js';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';

/** CSS classes */
const DEFAULT_BUTTON_CLASS = 'btn';
const TOGGLE_BUTTON_CLASS = 'toggle-btn';
const DEFAULT_ICON_CLASS = 'icon';
const TOGGLE_ICON_CLASS = 'toggle-icon';

export const sourceTypes = ['expense', 'transferfrom', 'debtfrom'];
const transTypeMap = {
    expense: EXPENSE,
    income: INCOME,
    transferfrom: TRANSFER,
    transferto: TRANSFER,
    debtfrom: DEBT,
    debtto: DEBT,
};

/** Base import transaction class */
export class ImportTransactionBase extends Component {
    initContainer(className, children) {
        const { originalData } = this.props;
        if (originalData) {
            const origDataContainer = OriginalImportData.create({
                ...originalData,
                mainAccount: this.state.mainAccount,
            });

            this.toggleExtBtn = this.createToggleButton();
            this.controls.append(this.toggleExtBtn);

            this.collapse = Collapsible.create({
                toggleOnClick: false,
                className,
                header: children,
                content: origDataContainer.elem,
            });
            this.elem = this.collapse.elem;
        } else {
            this.elem = window.app.createContainer(className, children);
        }
    }

    /** Returns toggle expand/collapse button */
    createToggleButton() {
        return ce(
            'button',
            { className: `${DEFAULT_BUTTON_CLASS} ${TOGGLE_BUTTON_CLASS}`, type: 'button' },
            window.app.createIcon('toggle-ext', `${DEFAULT_ICON_CLASS} ${TOGGLE_ICON_CLASS}`),
            { click: () => this.toggleCollapse() },
        );
    }

    /** Save original import data */
    saveOriginal(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.data = copyObject(data);
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

        this.setDate(window.app.formatDate(new Date(data.date)));
        this.setComment(data.comment);
    }

    /** Restore original data */
    restoreOriginal() {
        const currentMainAccount = this.data.mainAccount;

        this.setTransactionType('expense');
        this.setMainAccount(this.data.origAccount.id);
        this.setDestCurrency(this.data.origAccount.curr_id);
        this.setSourceAmount(0);
        this.setDestAmount(0);

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
        this.collapse?.toggle();
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

        if (this.state.mainAccount.id === account.id) {
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
                // If currencies was the same before, then set source and destination currencies
                // to as the currency of main account
                if (state.type === 'expense') {
                    state.destCurrId = state.srcCurrId;
                } else {
                    state.srcCurrId = state.destCurrId;
                }
            } else if (state.destCurrId === state.srcCurrId) {
                // If currencies was different before, but now became same, then
                // make source and destination amounts same value
                if (state.type === 'expense') {
                    state.sourceAmount = state.destAmount;
                } else {
                    state.destAmount = state.sourceAmount;
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
        if (state.srcCurrId === state.destCurrId) {
            state.sourceAmount = state.destAmount;
        }

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

        if (state.srcCurrId === state.destCurrId) {
            state.sourceAmount = state.destAmount;
        }

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

    /** Return date string */
    getDate() {
        return this.state.date;
    }
}
