import {
    TestComponent,
    query,
    queryAll,
    prop,
    hasClass,
    isVisible,
    click,
    assert,
} from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';

export class TransactionListItem extends TestComponent {
    async parseContent() {
        const res = {};

        const id = await prop(this.elem, 'dataset.id');
        res.id = parseInt(id, 10);
        const type = await prop(this.elem, 'dataset.type');
        res.type = parseInt(type, 10);
        res.selected = await hasClass(this.elem, 'trans-item_selected');
        res.detailsMode = await hasClass(this.elem, 'trans-item_details');

        if (res.detailsMode) {
            const [
                srcAccountElem,
                destAccountElem,
            ] = await queryAll(this.elem, '.trans-item__account-field .field__content');

            const sourceVisible = await isVisible(srcAccountElem, false);
            const destVisible = await isVisible(srcAccountElem, false);
            const sourceContent = await prop(srcAccountElem, 'textContent');
            const destContent = await prop(destAccountElem, 'textContent');

            if (sourceVisible && destVisible) {
                res.accountTitle = (sourceVisible) ? sourceContent : destContent;
            } else {
                res.accountTitle = `${sourceContent} → ${destContent}`;
            }

            const [
                srcAmountElem,
                destAmountElem,
            ] = await queryAll(this.elem, '.trans-item__amount-field .field__content');

            const destAmountVisible = await isVisible(destAmountElem, false);
            const srcAmount = await prop(srcAmountElem, 'textContent');
            const destAmount = await prop(destAmountElem, 'textContent');

            let sign;
            if (res.type === EXPENSE) {
                sign = '- ';
            }
            if (res.type === INCOME) {
                sign = '+ ';
            }
            if (res.type === TRANSFER) {
                sign = '';
            }
            if (res.type === DEBT) {
                let debtType;
                if (sourceVisible) {
                    const srcAcc = App.state.accounts.findByName(sourceContent);
                    debtType = srcAcc?.owner_id !== App.state.profile.owner_id;
                } else {
                    debtType = false;
                }
                const acc = (debtType) ? destVisible : sourceVisible;

                sign = (acc === debtType) ? '+ ' : '- ';
            }

            if (destAmountVisible) {
                res.amountText = `${sign}${srcAmount} (${sign}${destAmount})`;
            } else {
                res.amountText = `${sign}${srcAmount}`;
            }

            const dateElem = await query(this.elem, '.trans-item__date-field .field__content');
            res.dateFmt = await prop(dateElem, 'textContent');
        } else {
            const titleElem = await query(this.elem, '.trans-item__title');
            assert(titleElem, 'Account title not found');
            res.accountTitle = await prop(titleElem, 'textContent');

            const amountElem = await query(this.elem, '.trans-item__amount');
            assert(amountElem, 'Amount text not found');
            res.amountText = await prop(amountElem, 'textContent');

            const dateElem = await query(this.elem, '.trans-item__date');
            res.dateFmt = await prop(dateElem, 'textContent');
        }

        const commentElem = await query(this.elem, '.trans-item__comment');
        res.comment = (commentElem) ? await prop(commentElem, 'textContent') : '';

        return res;
    }

    async click() {
        return click(this.elem);
    }

    static render(transaction, state) {
        const res = {};

        assert(transaction, 'Invalid transaction object');
        assert(state, 'Invalid state object');

        const srcAcc = state.accounts.getItem(transaction.src_id);
        const destAcc = state.accounts.getItem(transaction.dest_id);
        const srcAmountFmt = App.currency.format(transaction.src_curr, transaction.src_amount);
        const destAmountFmt = App.currency.format(transaction.dest_curr, transaction.dest_amount);

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
            res.amountText = App.currency.format(transaction.src_curr, transaction.src_amount);
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (${destAmountFmt})`;
            }

            res.accountTitle = `${srcAcc.name} → ${destAcc.name}`;
        } else if (transaction.type === DEBT) {
            res.accountTitle = '';
            const debtType = (!!srcAcc && srcAcc.owner_id !== state.profile.owner_id);
            const personAcc = debtType ? srcAcc : destAcc;
            const person = state.persons.getItem(personAcc.owner_id);
            assert(person, `Person ${personAcc.owner_id} not found`);

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

            res.amountText += App.currency.format(personAcc.curr_id, transaction.src_amount);
        }

        res.dateFmt = transaction.date;
        res.comment = transaction.comment;

        return res;
    }
}
