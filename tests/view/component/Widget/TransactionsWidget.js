import { query } from 'jezve-test';
import { Widget } from './Widget.js';
import { TransactionList } from '../TransactionList.js';

export class TransactionsWidget extends Widget {
    async parseContent() {
        const res = await super.parseContent();

        if (res.title !== 'Transactions') {
            throw new Error('Invalid widget');
        }

        const transactions = await TransactionList.create(this, await query(this.elem, '.trans-list'));
        if (!transactions) {
            throw new Error('Invalid transactions widget');
        }

        res.transList = transactions;

        return res;
    }
}
