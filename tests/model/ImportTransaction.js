import { assert } from 'jezve-test';
import { App } from '../Application.js';
import {
    fixFloat, normalize,
} from '../common.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from './Transaction.js';

export const sourceTypes = ['expense', 'transferfrom', 'debtfrom'];

export class ImportTransaction {
    /** List of available transaction types */
    static availTypes = [
        { id: 'expense', title: 'Expense' },
        { id: 'income', title: 'Income' },
        { id: 'transferfrom', title: 'Transfer from' },
        { id: 'transferto', title: 'Transfer to' },
        { id: 'debtfrom', title: 'Debt from' },
        { id: 'debtto', title: 'Debt to' },
    ];

    /** Map transaction types from import to normal */
    static typesMap = {
        expense: EXPENSE,
        income: INCOME,
        transferfrom: TRANSFER,
        transferto: TRANSFER,
        debtfrom: DEBT,
        debtto: DEBT,
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
            mainAccount,
            type: (data.accountAmount < 0) ? 'expense' : 'income',
            date: data.date,
            comment: data.comment,
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
    static findTypeByName(name) {
        assert.isString(name, 'Invalid parameter');

        const lcName = name.toLowerCase();
        return this.availTypes.find((item) => item.title.toLowerCase() === lcName);
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

    /** Enable/disable transaction */
    enable(value = true) {
        this.enabled = !!value;
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
        } else if (this.type === 'transferfrom' || this.type === 'transferto') {
            if (this.src_id === this.dest_id) {
                const accId = App.state.getNextAccount(this.mainAccount.id);
                const transferAccount = App.state.accounts.getItem(accId);

                if (this.type === 'transferfrom') {
                    this.dest_id = transferAccount.id;
                    this.dest_curr = transferAccount.curr_id;
                } else {
                    this.src_id = transferAccount.id;
                    this.src_curr = transferAccount.curr_id;
                }
            }
        } else if (this.type === 'debtfrom' || this.type === 'debtto') {
            if (this.type === 'debtfrom') {
                this.dest_curr = this.src_curr;
            } else {
                this.src_curr = this.dest_curr;
            }
        }
    }

    setTransactionType(value) {
        assert((value in ImportTransaction.typesMap), `Unknown import transaction type: ${value}`);

        if (this.type === value) {
            return;
        }

        const srcTypes = ['expense', 'transferfrom', 'debtfrom'];
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

        if (value === 'debtfrom' || value === 'debtto') {
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
        } else if (value === 'transferfrom' || value === 'transferto') {
            if (before.type === 'debtfrom' || before.type === 'debtto') {
                return;
            }

            if (before.type === 'transferfrom' || before.type === 'transferto') {
                if (value === 'transferfrom') {
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

                if (value === 'transferfrom') {
                    this.dest_id = nextAccount.id;
                    this.dest_curr = nextAccount.curr_id;
                } else {
                    this.src_id = nextAccount.id;
                    this.src_curr = nextAccount.curr_id;
                }
            }
        } else if (value === 'debtfrom' || value === 'debtto') {
            if (before.type !== 'debtfrom' && before.type !== 'debtto') {
                const person = App.state.persons.getItemByIndex(0);
                assert(person, 'Failed to find person');
                this.person_id = person.id;
            }

            this.acc_id = this.mainAccount.id;
            this.op = (value === 'debtto') ? 1 : 2;
        }
    }

    /** Change transaction type so source and destination are swapped */
    invertTransactionType() {
        const invertMap = {
            expense: 'income',
            income: 'expense',
            transferfrom: 'transferto',
            transferto: 'transferfrom',
            debtto: 'debtfrom',
            debtfrom: 'debtto',
        };

        const invertedType = invertMap[this.type];

        this.setTransactionType(invertedType);
    }

    setAccount(value) {
        assert(
            this.type === 'transferfrom' || this.type === 'transferto',
            `Invalid transaction type to set second account: ${this.type}`,
        );

        const account = App.state.accounts.getItem(value);
        assert(account, `Account not found: ${value}`);

        if (this.type === 'transferfrom') {
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
    }

    setPerson(value) {
        assert(
            this.type === 'debtfrom' || this.type === 'debtto',
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

        const absAmount = Math.abs(amount);
        this.src_amount = absAmount;
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
            const currency = App.currency.findByName(this.original.transactionCurrency);
            assert(currency, `Currency ${this.original.transactionCurrency} not found`);
            if (this.type === 'expense') {
                this.dest_curr = currency.id;
            } else if (this.type === 'income') {
                this.src_curr = currency.id;
            }
        }

        this.date = this.original.date;
        this.comment = this.original.comment;
    }

    getExpectedTransaction() {
        const res = {
            type: ImportTransaction.typeFromString(this.type),
            src_curr: this.src_curr,
            dest_curr: this.dest_curr,
            date: this.date,
            comment: this.comment,
        };

        if (res.type !== DEBT) {
            res.src_id = this.src_id;
            res.dest_id = this.dest_id;
        }

        if (res.type === EXPENSE) {
            res.dest_amount = normalize(this.dest_amount);
            if (this.isDiff()) {
                res.src_amount = normalize(this.src_amount);
            } else {
                res.src_amount = res.dest_amount;
            }
        } else if (res.type === INCOME) {
            res.src_amount = normalize(this.src_amount);
            if (this.isDiff()) {
                res.dest_amount = normalize(this.dest_amount);
            } else {
                res.dest_amount = res.src_amount;
            }
        } else if (res.type === TRANSFER) {
            res.src_amount = normalize(this.src_amount);
            res.dest_amount = (this.isDiff())
                ? normalize(this.dest_amount)
                : res.src_amount;
        } else if (res.type === DEBT) {
            assert(this.person_id, 'Invalid person id');

            res.acc_id = this.acc_id;
            res.person_id = this.person_id;
            res.op = this.op;
            res.src_amount = normalize(this.src_amount);
            res.dest_amount = res.src_amount;
        }

        return res;
    }
}
