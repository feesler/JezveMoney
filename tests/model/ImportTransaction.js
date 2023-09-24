import { assert, isDate } from 'jezve-test';
import { App } from '../Application.js';
import {
    dateToSeconds,
    fixFloat,
    normalize,
} from '../common.js';
import { getCurrencyPrecision } from './import.js';
import { __ } from './locale.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    LIMIT_CHANGE,
} from './Transaction.js';

export const sourceTypes = ['expense', 'transfer_out', 'debt_out'];

export class ImportTransaction {
    /** List of available transaction types */
    static availTypes = [
        { id: 'expense', titleToken: 'transactions.types.expense' },
        { id: 'income', titleToken: 'transactions.types.income' },
        { id: 'transfer_out', titleToken: 'transactions.types.transferOut' },
        { id: 'transfer_in', titleToken: 'transactions.types.transferIn' },
        { id: 'debt_out', titleToken: 'transactions.types.debtOut' },
        { id: 'debt_in', titleToken: 'transactions.types.debtIn' },
        { id: 'limit', titleToken: 'transactions.types.creditLimit' },
    ];

    /** Map transaction types from import to normal */
    static typesMap = {
        expense: EXPENSE,
        income: INCOME,
        transfer_out: TRANSFER,
        transfer_in: TRANSFER,
        debt_out: DEBT,
        debt_in: DEBT,
        limit: LIMIT_CHANGE,
    };

    /** Convert import data to transaction object */
    static fromImportData(data, mainAccount) {
        assert(data && mainAccount, 'Invalid data');

        assert(
            mainAccount.curr_id === data.accountCurrencyId,
            `Invalid currency ${data.accountCurrencyId} Expected ${mainAccount.curr_id}`,
        );

        const res = new ImportTransaction({
            enabled: true,
            similarTransaction: null,
            rulesApplied: false,
            modifiedByUser: false,
            mainAccount,
            type: (data.accountAmount < 0) ? 'expense' : 'income',
            category_id: 0,
            comment: data.comment,
            date: isDate(data.date) ? dateToSeconds(data.date) : null,
            original: data,
        });

        if (res.type === 'expense') {
            res.src_id = mainAccount.id;
            res.dest_id = 0;
            res.src_amount = Math.abs(data.accountAmount);
            res.dest_amount = Math.abs(data.transactionAmount);
            res.src_curr = data.accountCurrencyId;
            res.dest_curr = data.transactionCurrencyId;
        } else {
            res.src_id = 0;
            res.dest_id = mainAccount.id;
            res.src_amount = Math.abs(data.transactionAmount);
            res.dest_amount = Math.abs(data.accountAmount);
            res.src_curr = data.transactionCurrencyId;
            res.dest_curr = data.accountCurrencyId;
        }

        return res;
    }

    /**
     * Search import transaction type by id
     * @param {string} id - transaction type id string
     */
    static getTypeById(value) {
        return this.availTypes.find((item) => item.id === value);
    }

    /** Search import transaction type by name (case insensitive) */
    static findTypeByName(name, locale) {
        assert.isString(name, 'Invalid parameter');

        const lcName = name.toLowerCase();
        return this.availTypes.find((item) => __(item.titleToken, locale).toLowerCase() === lcName);
    }

    /** Return normal type of transaction by import type name */
    static typeFromString(str) {
        assert.isString(str, 'Invalid parameter');

        const lstr = str.toLowerCase();
        assert((lstr in this.typesMap), `Unknown import transaction type: ${str}`);

        return this.typesMap[lstr];
    }

    constructor(props) {
        Object.assign(this, props);
    }

    isDiff() {
        return (this.src_curr !== this.dest_curr);
    }

    reminderSelected() {
        return !!this.reminder_id || !!this.schedule_id;
    }

    /** Returns true if both items has the same reminder selected */
    isSameRemiderSelected(ref) {
        return (
            (
                !!this.reminder_id
                && this.reminder_id === ref.reminder_id
            ) || (
                !!this.schedule_id
                && this.schedule_id === ref.schedule_id
                && this.reminder_date === ref.reminder_date
            )
        );
    }

    /** Enable/disable transaction */
    enable(value = true) {
        this.enabled = !!value;
    }

    setRulesApplied(value) {
        this.rulesApplied = !!value;
    }

    setModified(value = true) {
        this.modifiedByUser = !!value;
    }

    /** Trims values of amounts according to currencies */
    trimAmounts() {
        const srcPrecision = getCurrencyPrecision(this.src_curr);
        const destPrecision = getCurrencyPrecision(this.dest_curr);
        this.src_amount = normalize(this.src_amount, srcPrecision);
        this.dest_amount = normalize(this.dest_amount, destPrecision);
    }

    isChanged(transaction) {
        const props = [
            'type',
            'src_id',
            'dest_id',
            'src_curr',
            'dest_curr',
            'src_amount',
            'dest_amount',
            'person_id',
            'date',
            'category_id',
            'comment',
            'reminder_id',
            'schedule_id',
            'reminder_date',
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
            return;
        }

        this.similarTransaction = (transaction) ? { ...transaction } : null;
        this.enabled = !transaction;
    }

    /** Set main account */
    setMainAccount(value) {
        const account = App.state.accounts.getItem(value);
        if (!account) {
            throw new Error('Account not found');
        }

        if (this.mainAccount.id === account.id) {
            return;
        }
        this.mainAccount = account;
        if (this.original) {
            this.original.mainAccount = account;
        }

        const before = {
            isDiff: this.isDiff(),
        };

        if (sourceTypes.includes(this.type)) {
            this.src_id = account.id;
            this.src_curr = account.curr_id;
        } else {
            this.dest_id = account.id;
            this.dest_curr = account.curr_id;
        }

        if (this.type === 'expense' || this.type === 'income') {
            if (!before.isDiff) {
                // If currencies was the same before, then set source and destination currencies
                // to as the currency of main account
                if (this.type === 'expense') {
                    this.dest_curr = this.src_curr;
                } else {
                    this.src_curr = this.dest_curr;
                }
            } else if (this.dest_curr === this.src_curr) {
                // If currencies was different before, but now became same, then
                // make source and destination amounts same value
                if (this.type === 'expense') {
                    this.src_amount = this.dest_amount;
                } else {
                    this.dest_amount = this.src_amount;
                }
            }
        } else if (this.type === 'transfer_out' || this.type === 'transfer_in') {
            if (this.src_id === this.dest_id) {
                const accId = App.state.getNextAccount(this.mainAccount.id);
                const transferAccount = App.state.accounts.getItem(accId);

                if (this.type === 'transfer_out') {
                    this.dest_id = transferAccount.id;
                    this.dest_curr = transferAccount.curr_id;
                } else {
                    this.src_id = transferAccount.id;
                    this.src_curr = transferAccount.curr_id;
                }
            }
        } else if (this.type === 'debt_out' || this.type === 'debt_in') {
            this.acc_id = this.mainAccount.id;
            if (this.type === 'debt_out') {
                this.dest_curr = this.src_curr;
            } else {
                this.src_curr = this.dest_curr;
            }
        } else if (this.type === 'limit') {
            this.src_curr = this.dest_curr;
        }

        this.trimAmounts();
    }

    setTransactionType(value) {
        assert((value in ImportTransaction.typesMap), `Unknown import transaction type: ${value}`);

        if (this.type === value) {
            return;
        }

        const srcTypes = ['expense', 'transfer_out', 'debt_out'];
        const before = {
            isDiff: this.isDiff(),
            type: this.type,
            src_id: this.src_id,
            dest_id: this.dest_id,
            src_amount: this.src_amount,
            dest_amount: this.dest_amount,
            src_curr: this.src_curr,
            dest_curr: this.dest_curr,
            isSrcType: srcTypes.includes(this.type),
        };

        const isSrcType = srcTypes.includes(value);
        if (before.isSrcType !== isSrcType) {
            this.src_amount = before.dest_amount;
            this.dest_amount = before.src_amount;
            this.src_curr = before.dest_curr;
            this.dest_curr = before.src_curr;
        }

        if (value === 'debt_out' || value === 'debt_in') {
            delete this.src_id;
            delete this.dest_id;
        } else {
            delete this.person_id;
            delete this.op;
            delete this.acc_id;

            if (isSrcType) {
                this.src_id = this.mainAccount.id;
                this.src_curr = this.mainAccount.curr_id;
            } else {
                this.dest_id = this.mainAccount.id;
                this.dest_curr = this.mainAccount.curr_id;
            }
        }

        this.type = value;
        if (value === 'expense') {
            this.dest_id = 0;
            if (!before.isDiff || before.type !== 'income') {
                this.dest_curr = this.mainAccount.curr_id;
            }
        } else if (value === 'income') {
            this.src_id = 0;
            if (!before.isDiff || before.type !== 'expense') {
                this.src_curr = this.mainAccount.curr_id;
            }
        } else if (value === 'transfer_out' || value === 'transfer_in') {
            if (before.type === 'debt_out' || before.type === 'debt_in') {
                return;
            }

            if (before.type === 'transfer_out' || before.type === 'transfer_in') {
                if (value === 'transfer_out') {
                    this.dest_id = before.src_id;
                    this.dest_curr = before.src_curr;
                } else {
                    this.src_id = before.dest_id;
                    this.src_curr = before.dest_curr;
                }
            } else {
                const accountId = App.state.getNextAccount(this.mainAccount.id);
                const nextAccount = App.state.accounts.getItem(accountId);
                assert(nextAccount, 'Failed to find next account');

                if (value === 'transfer_out') {
                    this.dest_id = nextAccount.id;
                    this.dest_curr = nextAccount.curr_id;
                } else {
                    this.src_id = nextAccount.id;
                    this.src_curr = nextAccount.curr_id;
                }
            }
        } else if (value === 'debt_out' || value === 'debt_in') {
            if (before.type !== 'debt_out' && before.type !== 'debt_in') {
                const person = App.state.persons.getItemByIndex(0);
                assert(person, 'Failed to find person');
                this.person_id = person.id;
            }

            this.acc_id = this.mainAccount.id;
            this.op = (value === 'debt_in') ? 1 : 2;
        }

        if (this.category_id !== 0) {
            const category = App.state.categories.getItem(this.category_id);
            assert(category, `Category not found: '${this.category_id}'`);

            const realType = ImportTransaction.typeFromString(this.type);
            if (category.type !== 0 && category.type !== realType) {
                this.category_id = 0;
            }
        } else if (value === 'limit') {
            this.src_id = 0;
            this.src_curr = before.dest_curr;
            if (this.type === 'income') {
                this.destAmount = this.sourceAmount;
            }
            this.sourceAmount = this.destAmount;
        }

        this.trimAmounts();
    }

    /** Change transaction type so source and destination are swapped */
    invertTransactionType() {
        const invertMap = {
            expense: 'income',
            income: 'expense',
            transfer_out: 'transfer_in',
            transfer_in: 'transfer_out',
            debt_in: 'debt_out',
            debt_out: 'debt_in',
        };

        const invertedType = invertMap[this.type];
        if (invertedType) {
            this.setTransactionType(invertedType);
        }
    }

    setAccount(value) {
        assert(
            this.type === 'transfer_out' || this.type === 'transfer_in',
            `Invalid transaction type to set second account: ${this.type}`,
        );

        const account = App.state.accounts.getItem(value);
        assert(account, `Account not found: ${value}`);

        if (this.type === 'transfer_out') {
            this.dest_id = account.id;
            this.dest_curr = account.curr_id;
            if (!this.isDiff()) {
                this.dest_amount = this.src_amount;
            }
        } else {
            this.src_id = account.id;
            this.src_curr = account.curr_id;
            if (!this.isDiff()) {
                this.src_amount = this.dest_amount;
            }
        }

        this.trimAmounts();
    }

    setPerson(value) {
        assert(
            this.type === 'debt_out' || this.type === 'debt_in',
            `Invalid transaction type to set person: ${this.type}`,
        );

        const person = App.state.persons.getItem(value);
        assert(person, `Person not found: ${value}`);

        this.person_id = person.id;
    }

    setSourceAmount(value) {
        const amount = parseFloat(fixFloat(value));
        assert(!Number.isNaN(amount), 'Invalid amount value');

        if (amount < 0) {
            this.invertTransactionType();
        }

        this.src_amount = Math.abs(amount);
        if (!this.isDiff()) {
            this.dest_amount = this.src_amount;
        }
    }

    setDestAmount(value) {
        const amount = parseFloat(fixFloat(value));
        assert(!Number.isNaN(amount), 'Invalid amount value');

        this.dest_amount = Math.abs(amount);
        if (!this.isDiff()) {
            this.src_amount = this.dest_amount;
        }
    }

    setComment(value) {
        this.comment = value;
    }

    /** Sets reminder */
    setReminder(reminder) {
        if (!reminder) {
            throw new Error('Invalid reminder');
        }

        this.reminder_id = reminder.reminder_id ?? 0;
        this.schedule_id = reminder.schedule_id ?? 0;
        this.reminder_date = reminder.reminder_date ?? 0;
    }

    /** Removed reminder */
    removeReminder() {
        this.reminder_id = 0;
        this.schedule_id = 0;
        this.reminder_date = 0;
    }

    restoreOriginal() {
        assert(this.original, 'Original data not found');

        this.mainAccount = App.state.accounts.getItem(this.original.origAccount.id);
        assert(this.mainAccount, `Account ${this.original.origAccount.id} not found`);
        const mainAccountCurrency = App.currency.getItem(this.mainAccount.curr_id);
        assert(mainAccountCurrency, `Currency ${this.mainAccount.curr_id} not found`);

        const accAmount = parseFloat(fixFloat(this.original.accountAmount));
        const trAmount = parseFloat(fixFloat(this.original.transactionAmount));
        this.type = (accAmount > 0) ? 'income' : 'expense';
        if (this.type === 'expense') {
            this.src_id = this.mainAccount.id;
            this.dest_id = 0;
            this.dest_amount = Math.abs(trAmount);
            this.src_amount = Math.abs(accAmount);
            this.src_curr = mainAccountCurrency.id;
        } else if (this.type === 'income') {
            this.src_id = 0;
            this.dest_id = this.mainAccount.id;
            this.src_amount = Math.abs(trAmount);
            this.dest_amount = Math.abs(accAmount);
            this.dest_curr = mainAccountCurrency.id;
        }

        if (this.original.accountCurrency === this.original.transactionCurrency) {
            if (this.type === 'expense') {
                this.dest_curr = mainAccountCurrency.id;
            } else if (this.type === 'income') {
                this.src_curr = mainAccountCurrency.id;
            }
        } else {
            const currency = App.currency.findByCode(this.original.transactionCurrency);
            assert(currency, `Currency ${this.original.transactionCurrency} not found`);
            if (this.type === 'expense') {
                this.dest_curr = currency.id;
            } else if (this.type === 'income') {
                this.src_curr = currency.id;
            }
        }

        this.date = isDate(this.original.date) ? dateToSeconds(this.original.date) : null;

        this.category_id = 0;
        this.comment = this.original.comment;

        this.rulesApplied = false;
        this.modifiedByUser = false;
    }

    getExpectedTransaction() {
        const res = {
            type: ImportTransaction.typeFromString(this.type),
            src_curr: this.src_curr,
            dest_curr: this.dest_curr,
            category_id: this.category_id,
            date: this.date,
            comment: this.comment,
        };

        if (res.type !== DEBT) {
            res.src_id = this.src_id;
            res.dest_id = this.dest_id;
        }

        const srcPrecision = getCurrencyPrecision(this.src_curr);
        const destPrecision = getCurrencyPrecision(this.dest_curr);

        if (res.type === EXPENSE) {
            res.dest_amount = normalize(this.dest_amount, destPrecision);
            if (this.isDiff()) {
                res.src_amount = normalize(this.src_amount, srcPrecision);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === INCOME) {
            res.src_amount = normalize(this.src_amount, srcPrecision);
            if (this.isDiff()) {
                res.dest_amount = normalize(this.dest_amount, destPrecision);
            } else {
                res.dest_amount = res.src_amount;
            }
        } else if (res.type === TRANSFER) {
            res.src_amount = normalize(this.src_amount, srcPrecision);
            res.dest_amount = (this.isDiff())
                ? normalize(this.dest_amount, destPrecision)
                : res.src_amount;
        } else if (res.type === DEBT) {
            assert(this.person_id, 'Invalid person id');

            res.acc_id = this.acc_id;
            res.person_id = this.person_id;
            res.op = this.op;
            res.src_amount = normalize(this.src_amount, srcPrecision);
            res.dest_amount = res.src_amount;
        } else if (res.type === LIMIT_CHANGE) {
            const decrease = (this.dest_amount < 0);
            if (decrease) {
                res.src_id = this.dest_id;
                res.dest_id = 0;
            }

            res.src_amount = normalize(Math.abs(this.src_amount), srcPrecision);
            res.dest_amount = normalize(Math.abs(this.dest_amount), destPrecision);
        }

        const reminderId = (this.reminder_id) ? parseInt(this.reminder_id, 10) : 0;
        const scheduleId = (this.schedule_id) ? parseInt(this.schedule_id, 10) : 0;
        if (reminderId !== 0) {
            res.reminder_id = reminderId;
        } else if (scheduleId !== 0) {
            res.schedule_id = scheduleId;
            res.reminder_date = parseInt(this.reminder_date, 10);
        }

        return res;
    }
}
