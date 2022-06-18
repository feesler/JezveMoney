import { assert } from 'jezve-test';
import { App } from '../Application.js';
import {
    fixFloat,
} from '../common.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from './Transaction.js';

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

    constructor(props) {
        Object.assign(this, props);
    }

    /** Convert import data to transaction object */
    static fromImportData(data, mainAccount) {
        assert(data && mainAccount, 'Invalid data');

        assert(
            mainAccount.curr_id === data.accountCurrencyId,
            `Invalid currency ${data.accountCurrencyId} Expected ${mainAccount.curr_id}`,
        );

        const res = new ImportTransaction({
            enabled: true,
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

    isDiff() {
        return (this.src_curr !== this.dest_curr);
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
            if (before.type !== 'debtfrom' && before.type !== 'debtto') {
                const accountId = App.state.accounts.getNext(this.mainAccount.id);
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

    setAmount(value) {
        const amount = parseFloat(fixFloat(value));
        assert(!Number.isNaN(amount), 'Invalid amount value');

        if (amount < 0) {
            this.invertTransactionType();
        }

        const absAmount = Math.abs(amount);
        if (this.type === 'income') {
            this.dest_amount = absAmount;
        } else {
            this.src_amount = absAmount;
        }
    }

    setSecondAmount(value) {
        const amount = parseFloat(fixFloat(value));
        assert(!Number.isNaN(amount), 'Invalid amount value');

        this.dest_amount = Math.abs(amount);
    }

    setComment(value) {
        this.comment = value;
    }
}
