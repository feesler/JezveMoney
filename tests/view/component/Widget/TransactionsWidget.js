import { query, assert } from 'jezve-test';
import { Widget } from './Widget.js';
import { TransactionList } from '../TransactionList/TransactionList.js';

export class TransactionsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        const transactions = await TransactionList.create(this, await query(this.elem, '.trans-list'));
        assert(transactions, 'Invalid transactions widget');

        res.transList = transactions;

        return res;
    }
}
