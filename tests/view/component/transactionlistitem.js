import { Component } from './component.js';
import { Currency } from '../../model/currency.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../model/transaction.js';

export class TransactionListItem extends Component {
    async parse() {
        this.id = parseInt(await this.prop(this.elem, 'dataset.id'), 10);
        this.selected = await this.hasClass(this.elem, 'trans-list__item_selected');

        const titleElem = await this.query(this.elem, '.trans-list__item-title > span');
        if (!titleElem) {
            throw new Error('Account title not found');
        }
        this.accountTitle = await this.prop(titleElem, 'textContent');

        const amountElem = await this.query(this.elem, '.trans-list__item-content > span');
        if (!amountElem) {
            throw new Error('Amount text not found');
        }
        this.amountText = await this.prop(amountElem, 'textContent');

        const dateElem = await this.query(this.elem, '.trans-list__item-details > *');
        if (!dateElem || await this.prop(dateElem, 'tagName') !== 'SPAN') {
            throw new Error('Date element not found');
        }

        this.dateFmt = await this.prop(dateElem, 'textContent');

        const commentElem = await this.query(this.elem, '.trans-list__item-comment');
        this.comment = (commentElem) ? await this.prop(commentElem, 'textContent') : '';
    }

    async click() {
        return this.environment.click(this.elem);
    }

    static render(transaction, state) {
        const res = {};

        if (!transaction) {
            throw new Error('Invalid transaction object');
        }
        if (!state) {
            throw new Error('Invalid state object');
        }

        const srcAcc = state.accounts.getItem(transaction.src_id);
        const destAcc = state.accounts.getItem(transaction.dest_id);
        const srcAmountFmt = Currency.format(transaction.src_curr, transaction.src_amount);
        const destAmountFmt = Currency.format(transaction.dest_curr, transaction.dest_amount);

        if (transaction.type === EXPENSE) {
            res.amountText = `- ${srcAmountFmt}`;
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (- ${destAmountFmt})`;
            }

            res.accountTitle = srcAcc.name;
        } else if (transaction.type === INCOME) {
            res.amountText = `+ ${srcAmountFmt}`;
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (+ ${destAmountFmt})`;
            }

            res.accountTitle = destAcc.name;
        } else if (transaction.type === TRANSFER) {
            res.amountText = Currency.format(transaction.src_curr, transaction.src_amount);
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (${destAmountFmt})`;
            }

            res.accountTitle = `${srcAcc.name} → ${destAcc.name}`;
        } else if (transaction.type === DEBT) {
            res.accountTitle = '';
            const debtType = (!!srcAcc && srcAcc.owner_id !== state.profile.owner_id);
            const personAcc = debtType ? srcAcc : destAcc;
            const person = state.persons.getItem(personAcc.owner_id);
            if (!person) {
                throw new Error(`Person ${personAcc.owner_id} not found`);
            }

            const acc = (debtType) ? destAcc : srcAcc;

            if (debtType) {
                res.accountTitle = person.name;
                if (acc) {
                    res.accountTitle += ` → ${acc.name}`;
                }
                res.amountText = (acc) ? '+ ' : '- ';
            } else {
                if (acc) {
                    res.accountTitle = `${acc.name} → `;
                }
                res.accountTitle += person.name;
                res.amountText = (srcAcc) ? '- ' : '+ ';
            }

            res.amountText += Currency.format(personAcc.curr_id, transaction.src_amount);
        }

        res.dateFmt = transaction.date;
        res.comment = transaction.comment;

        return res;
    }
}
