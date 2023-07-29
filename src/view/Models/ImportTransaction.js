import {
    trimDecimalPlaces,
    fixFloat,
} from 'jezvejs';
import {
    dateStringToTime,
    getCurrencyPrecision,
    __,
} from '../utils/utils.js';
import { App } from '../Application/App.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from './Transaction.js';

/** Trims values of amounts according to currencies */
const trimAmounts = (state) => {
    const res = state;

    res.sourceAmount = trimDecimalPlaces(
        state.sourceAmount,
        getCurrencyPrecision(state.srcCurrId),
    );
    res.destAmount = trimDecimalPlaces(
        state.destAmount,
        getCurrencyPrecision(state.destCurrId),
    );

    return res;
};

export const sourceTypes = ['expense', 'transfer_out', 'debt_out'];
export const transTypeMap = {
    expense: EXPENSE,
    income: INCOME,
    transfer_out: TRANSFER,
    transfer_in: TRANSFER,
    debt_out: DEBT,
    debt_in: DEBT,
    limit: LIMIT_CHANGE,
};

export const typeNames = {
    expense: __('transactions.types.expense'),
    income: __('transactions.types.income'),
    transfer_out: __('transactions.types.transferOut'),
    transfer_in: __('transactions.types.transferIn'),
    debt_out: __('transactions.types.debtOut'),
    debt_in: __('transactions.types.debtIn'),
    limit: __('transactions.types.creditLimit'),
};

const defaultProps = {
    id: undefined,
    enabled: true,
    collapsed: true,
    selected: false,
    listMode: 'list',
    similarTransaction: null,
    rulesApplied: false,
    modifiedByUser: false,
    type: 'expense',
    sourceAccountId: 0,
    destAccountId: 0,
    srcCurrId: 0,
    destCurrId: 0,
    sourceAmount: 0,
    destAmount: 0,
    personId: 0,
    date: null,
    categoryId: 0,
    comment: '',
};

export class ImportTransaction {
    static fromImportData(data) {
        if (!data?.mainAccount) {
            throw new Error('Invalid data');
        }

        const { mainAccount } = data;
        if (data.accountCurrencyId !== mainAccount.curr_id) {
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

        const isExpense = (accAmount < 0);
        const item = {
            mainAccount,
            id: data.id,
            enabled: true,
            type: (isExpense) ? 'expense' : 'income',
            originalData: {
                ...data,
                mainAccount: mainAccount.id,
                origAccount: { ...mainAccount },
            },

            sourceAccountId: (isExpense) ? mainAccount.id : 0,
            destAccountId: (isExpense) ? 0 : mainAccount.id,
            sourceAmount: (isExpense) ? Math.abs(accAmount) : Math.abs(trAmount),
            destAmount: (isExpense) ? Math.abs(trAmount) : Math.abs(accAmount),
            srcCurrId: (isExpense) ? data.accountCurrencyId : data.transactionCurrencyId,
            destCurrId: (isExpense) ? data.transactionCurrencyId : data.accountCurrencyId,
            date: App.formatDate(new Date(data.date)),
            categoryId: 0,
            comment: data.comment,
        };

        return new ImportTransaction(item);
    }

    static getTargetType(type) {
        if (!(type in transTypeMap)) {
            throw new Error('Invalid transaction type');
        }

        return transTypeMap[type];
    }

    constructor(props) {
        const data = (props instanceof ImportTransaction)
            ? structuredClone(props)
            : {
                ...defaultProps,
                ...props,
            };

        Object.assign(this, data);

        const { mainAccount } = this;

        if (this.date === null) {
            this.date = App.formatDate(new Date());
        }

        if (sourceTypes.includes(this.type)) {
            this.sourceAccountId = mainAccount.id;
            this.srcCurrId = mainAccount.curr_id;
            if (!this.destCurrId) {
                this.destCurrId = mainAccount.curr_id;
            }

            if (this.type === 'transfer_out') {
                const account = this.getTransferAccount(this.destAccountId);
                this.destAccountId = account.id;
                this.destCurrId = account.curr_id;
            }
        } else {
            this.destAccountId = mainAccount.id;
            this.destCurrId = mainAccount.curr_id;
            if (!this.srcCurrId) {
                this.srcCurrId = mainAccount.curr_id;
            }

            if (this.type === 'transfer_in') {
                const account = this.getTransferAccount(this.sourceAccountId);
                this.sourceAccountId = account.id;
                this.srcCurrId = account.curr_id;
            }
        }

        if (this.type === 'debt_out' || this.type === 'debt_in') {
            if (!this.personId) {
                const person = App.model.persons.getItemByIndex(0);
                if (!person) {
                    throw new Error('Person not found');
                }
                this.personId = person.id;
            }
        }
    }

    /**
     * Enable/disable transaction
     * @param {boolean} val - if true then enable, else disable
     */
    enable(value) {
        const enabled = !!value;
        if (this.enabled === enabled) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            enabled,
        });
    }

    /**
     * Select/deselect transaction
     * @param {boolean} val - if true then select, else deselect
     */
    select(value) {
        if (this.listMode !== 'select') {
            return this;
        }

        const selected = !!value;
        if (this.selected === selected) {
            return this;
        }
        return new ImportTransaction({
            ...structuredClone(this),
            selected,
        });
    }

    /**
     * Toggle select/deselect transaction
     */
    toggleSelect() {
        if (this.listMode !== 'select') {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            selected: !this.selected,
        });
    }

    /**
     * Changes list mode
     * @param {string} listMode
     */
    setListMode(listMode) {
        if (this.listMode === listMode) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            listMode,
            selected: false,
        });
    }

    /**
     * Collapse/expand
     * @param {boolean} val - if true then collapse, else expand
     */
    collapse(value) {
        const collapsed = !!value;
        if (this.collapsed === collapsed) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            collapsed,
        });
    }

    setRulesApplied(value) {
        const rulesApplied = !!value;
        if (this.rulesApplied === rulesApplied) {
            return this;
        }
        return new ImportTransaction({
            ...structuredClone(this),
            rulesApplied,
        });
    }

    setModified(value = true) {
        const modifiedByUser = !!value;
        if (this.modifiedByUser === modifiedByUser) {
            return this;
        }
        return new ImportTransaction({
            ...structuredClone(this),
            modifiedByUser,
        });
    }

    isChanged(transaction) {
        const props = [
            'type',
            'sourceAccountId',
            'destAccountId',
            'srcCurrId',
            'destCurrId',
            'sourceAmount',
            'destAmount',
            'personId',
            'date',
            'categoryId',
            'comment',
        ];

        return (
            (transaction)
                ? props.some((prop) => this[prop] !== transaction[prop])
                : true
        );
    }

    isSameSimilarTransaction(transaction) {
        return (
            (!this.similarTransaction && !transaction)
            || (
                this.similarTransaction
                && transaction
                && this.similarTransaction.id === transaction.id
            )
        );
    }

    /**
     * Set similar transaction value
     * @param {Object} transaction
     */
    setSimilarTransaction(transaction) {
        if (this.isSameSimilarTransaction(transaction)) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            similarTransaction: structuredClone(transaction),
            enabled: !transaction,
        });
    }

    /** Restore original data */
    restoreOriginal() {
        const res = ImportTransaction.fromImportData({
            ...this.originalData,
            mainAccount: this.originalData.origAccount,
        });
        return res.enable(this.enabled).setMainAccount(this.mainAccount.id);
    }

    getTransferAccount(initialId) {
        const { userAccounts } = App.model;

        let res = userAccounts.getItem(initialId);
        if (!res) {
            res = userAccounts.getNextAccount();
        }
        if (res.id === this.mainAccount.id) {
            res = userAccounts.getNextAccount(res.id);
        }

        return res;
    }

    /** Set type of transaction */
    setTransactionType(value) {
        if (typeof value !== 'string' || !(value in transTypeMap)) {
            throw new Error('Invalid transaction type');
        }

        if (this.type === value) {
            return this;
        }

        const state = structuredClone(this);
        const isDiffBefore = this.isDiff();
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
            if (!(state.type === 'income' && isDiffBefore)) {
                state.destAmount = this.sourceAmount;
                state.destCurrId = state.mainAccount.curr_id;
            }
            // Keep previous currencies from income
            if (state.type === 'income') {
                state.destCurrId = this.srcCurrId;
            }
        } else if (value === 'income') {
            state.personId = 0;
            state.sourceAccountId = 0;
            // Copy destination amount to source amount
            // if previous type was expense with same currencies
            if (state.type === 'expense' && !isDiffBefore) {
                state.sourceAmount = this.destAmount;
            }
            // Keep currencies from expense
            if (state.type === 'expense') {
                state.srcCurrId = this.destCurrId;
            }
            // Set source currency same as main account if currencies was the same or
            // previous type was not expense
            if (state.type !== 'expense' || !isDiffBefore) {
                state.srcCurrId = state.mainAccount.curr_id;
            }
        } else if (value === 'transfer_out') {
            state.personId = 0;
            // Copy destination amount to source amount
            // if previous type was expense
            if (state.type === 'expense') {
                state.sourceAmount = this.destAmount;
            }

            if (state.type === 'transfer_in') {
                state.destAccountId = this.sourceAccountId;
                state.destCurrId = this.srcCurrId;
            } else {
                const account = this.getTransferAccount(this.destAccountId);
                state.destAccountId = account.id;
                state.destCurrId = account.curr_id;
            }
        } else if (value === 'transfer_in') {
            state.personId = 0;
            // Copy destination amount to source amount
            // if previous type was expense
            if (state.type === 'expense') {
                state.sourceAmount = this.destAmount;
            }

            if (state.type === 'transfer_out') {
                state.sourceAccountId = this.destAccountId;
                state.srcCurrId = this.destCurrId;
            } else {
                const account = this.getTransferAccount(this.sourceAccountId);
                state.sourceAccountId = account.id;
                state.srcCurrId = account.curr_id;
            }
        } else if (value === 'debt_out' || value === 'debt_in') {
            // Copy destination amount to source amount
            // if previous type was expense
            if (state.type === 'expense') {
                state.sourceAmount = this.destAmount;
            }

            if (value === 'debt_out') {
                state.destAccountId = 0;
            } else {
                state.sourceAccountId = 0;
            }

            if (!state.personId) {
                const person = App.model.persons.getItemByIndex(0);
                if (!person) {
                    throw new Error('Person not found');
                }
                state.personId = person.id;
            }
            state.srcCurrId = state.mainAccount.curr_id;
            state.destCurrId = state.mainAccount.curr_id;
        } else if (value === 'limit') {
            state.sourceAccountId = 0;
            state.srcCurrId = state.destCurrId;
            if (state.type === 'income') {
                state.destAmount = this.sourceAmount;
            }
            state.sourceAmount = this.destAmount;
        }

        state.type = value;

        const { categories } = App.model;
        if (state.categoryId !== 0) {
            const category = categories.getItem(state.categoryId);
            const realType = ImportTransaction.getTargetType(state.type);
            if (category.type !== 0 && category.type !== realType) {
                state.categoryId = 0;
            }
        }

        const res = trimAmounts(state);
        return new ImportTransaction(res);
    }

    /** Set source currency */
    setSourceCurrency(value) {
        if (this.type !== 'income') {
            throw new Error('Invalid state');
        }

        const srcCurrId = parseInt(value, 10);
        if (Number.isNaN(srcCurrId)) {
            throw new Error('Invalid currency');
        }

        if (this.srcCurrId === srcCurrId) {
            return this;
        }

        const state = trimAmounts({
            ...structuredClone(this),
            srcCurrId,
        });

        return new ImportTransaction(state);
    }

    /** Set destination currency */
    setDestCurrency(value) {
        if (this.type !== 'expense') {
            throw new Error('Invalid state');
        }
        const destCurrId = parseInt(value, 10);
        if (Number.isNaN(destCurrId)) {
            throw new Error('Invalid currency');
        }

        if (this.destCurrId === destCurrId) {
            return this;
        }

        const state = trimAmounts({
            ...structuredClone(this),
            destCurrId,
        });

        return new ImportTransaction(state);
    }

    /** Set main account */
    setMainAccount(value) {
        const account = App.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.mainAccount.id === account.id) {
            return this;
        }

        const isDiffBefore = this.isDiff();
        const state = {
            ...structuredClone(this),
            mainAccount: account,
        };

        if (sourceTypes.includes(state.type)) {
            state.sourceAccountId = account.id;
            state.srcCurrId = account.curr_id;
        } else {
            state.destAccountId = account.id;
            state.destCurrId = account.curr_id;
        }

        if (this.originalData) {
            state.originalData.mainAccount = account.id;
        }

        if (state.type === 'expense' || state.type === 'income') {
            if (!isDiffBefore) {
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
        } else if (state.type === 'transfer_out' || state.type === 'transfer_in') {
            if (state.sourceAccountId === state.destAccountId) {
                const { userAccounts } = App.model;
                const nextAccount = userAccounts.getNextAccount(state.mainAccount.id);
                if (state.type === 'transfer_out') {
                    state.destAccountId = nextAccount.id;
                    state.destCurrId = nextAccount.curr_id;
                } else {
                    state.sourceAccountId = nextAccount.id;
                    state.srcCurrId = nextAccount.curr_id;
                }
            }
        } else if (state.type === 'debt_out' || state.type === 'debt_in') {
            if (state.type === 'debt_out') {
                state.destCurrId = state.srcCurrId;
            } else {
                state.srcCurrId = state.destCurrId;
            }
        } else if (state.type === 'limit') {
            state.srcCurrId = state.destCurrId;
        }

        const res = trimAmounts(state);
        return new ImportTransaction(res);
    }

    /** Set transfer account */
    setTransferAccount(value) {
        const account = App.model.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }
        const transferAccountId = (this.type === 'transfer_out')
            ? this.destAccountId
            : this.sourceAccountId;
        if (transferAccountId === account.id) {
            return this;
        }

        // Can't set transfer account same as main account
        if (this.mainAccount.id === account.id) {
            throw new Error('Can\'t set second account same as main account');
        }

        const state = {
            ...structuredClone(this),
        };
        if (state.type === 'transfer_out') {
            state.destAccountId = account.id;
            state.destCurrId = account.curr_id;
        } else {
            state.sourceAccountId = account.id;
            state.srcCurrId = account.curr_id;
        }

        const res = trimAmounts(state);
        return new ImportTransaction(res);
    }

    /** Set person */
    setPerson(value) {
        const person = App.model.persons.getItem(value);
        if (!person) {
            throw new Error('Person not found');
        }

        if (this.personId === person.id) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            personId: person.id,
        });
    }

    /** Set source amount */
    setSourceAmount(value) {
        const res = parseFloat(fixFloat(value));
        if (Number.isNaN(res)) {
            throw new Error('Invalid amount value');
        }

        if (this.sourceAmount === value) {
            return this;
        }

        const state = structuredClone(this);
        state.sourceAmount = value;
        if (state.srcCurrId === state.destCurrId) {
            state.destAmount = state.sourceAmount;
        }

        return new ImportTransaction(state);
    }

    /** Set destination amount */
    setDestAmount(value) {
        const res = parseFloat(fixFloat(value));
        if (Number.isNaN(res)) {
            throw new Error('Invalid amount value');
        }

        if (this.destAmount === value) {
            return this;
        }

        const state = structuredClone(this);
        state.destAmount = value;
        if (state.srcCurrId === state.destCurrId) {
            state.sourceAmount = state.destAmount;
        }

        return new ImportTransaction(state);
    }

    /** Set date */
    setDate(date) {
        if (typeof date === 'undefined') {
            throw new Error('Invalid date value');
        }

        if (this.date === date) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            date,
        });
    }

    /** Set category */
    setCategory(value) {
        const categoryId = parseInt(value, 10);
        if (this.categoryId === categoryId) {
            return this;
        }

        const { categories } = App.model;
        const category = categories.getItem(categoryId);
        if (categoryId !== 0 && !category) {
            throw new Error('Invalid category');
        }

        return new ImportTransaction({
            ...structuredClone(this),
            categoryId,
        });
    }

    /** Set comment */
    setComment(comment) {
        if (typeof comment !== 'string') {
            throw new Error('Invalid comment value');
        }

        if (this.comment === comment) {
            return this;
        }

        return new ImportTransaction({
            ...structuredClone(this),
            comment,
        });
    }

    /** Return transaction object */
    getData() {
        const { accounts, persons } = App.model;

        const srcAmountVal = parseFloat(fixFloat(this.sourceAmount));
        const destAmountVal = parseFloat(fixFloat(this.destAmount));
        const isDiff = this.isDiff();
        const res = {
            type: ImportTransaction.getTargetType(this.type),
            src_curr: this.srcCurrId,
            dest_curr: this.destCurrId,
            date: dateStringToTime(this.date),
            category_id: this.categoryId,
            comment: this.comment,
        };

        if (this.type === 'expense') {
            res.src_id = this.sourceAccountId;
            res.dest_id = 0;
            res.src_amount = (isDiff) ? srcAmountVal : destAmountVal;
            res.dest_amount = destAmountVal;
        } else if (this.type === 'income') {
            res.src_id = 0;
            res.dest_id = this.destAccountId;
            res.src_amount = srcAmountVal;
            res.dest_amount = (isDiff) ? destAmountVal : srcAmountVal;
        } else if (this.type === 'transfer_out' || this.type === 'transfer_in') {
            const id = (this.type === 'transfer_in') ? this.sourceAccountId : this.destAccountId;
            const transferAcc = accounts.getItem(id);
            if (!transferAcc) {
                throw new Error('Invalid transaction: Account not found');
            }

            res.src_id = this.sourceAccountId;
            res.dest_id = this.destAccountId;
            res.src_amount = srcAmountVal;
            res.dest_amount = (isDiff) ? destAmountVal : srcAmountVal;
        } else if (this.type === 'debt_out' || this.type === 'debt_in') {
            const person = persons.getItem(this.personId);
            if (!person) {
                throw new Error('Invalid transaction: Person not found');
            }

            res.op = (this.type === 'debt_in') ? 1 : 2;
            res.person_id = person.id;
            res.acc_id = this.mainAccount.id;
            res.src_amount = srcAmountVal;
            res.dest_amount = srcAmountVal;
        } else if (this.type === 'limit') {
            const decrease = (destAmountVal < 0);
            res.src_id = (decrease) ? this.mainAccount.id : 0;
            res.dest_id = (decrease) ? 0 : this.mainAccount.id;
            res.src_amount = Math.abs(destAmountVal);
            res.dest_amount = Math.abs(destAmountVal);
        }

        return res;
    }

    isDiff() {
        return this.srcCurrId !== this.destCurrId;
    }

    validateAmount(value) {
        const amountValue = parseFloat(fixFloat(value));
        return (!Number.isNaN(amountValue) && amountValue > 0);
    }

    validateSourceAmount() {
        return this.validateAmount(this.sourceAmount);
    }

    validateDestAmount() {
        const amount = (this.type === 'limit') ? Math.abs(this.destAmount) : this.destAmount;
        return this.validateAmount(amount);
    }

    validate() {
        const isDiff = this.isDiff();
        const startFromDest = ['expense', 'limit'].includes(this.type);

        let valid = (startFromDest) ? this.validateDestAmount() : this.validateSourceAmount();
        if (valid && isDiff) {
            valid = (startFromDest) ? this.validateSourceAmount() : this.validateDestAmount();
        }

        if (valid) {
            valid = App.isValidDateString(this.date);
        }

        return valid;
    }
}
