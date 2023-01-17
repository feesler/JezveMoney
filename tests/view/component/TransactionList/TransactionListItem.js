import {
    TestComponent,
    query,
    queryAll,
    isVisible,
    click,
    assert,
    evaluate,
} from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
} from '../../../model/Transaction.js';
import { App } from '../../../Application.js';

export class TransactionListItem extends TestComponent {
    async parseContent() {
        const commentElem = await query(this.elem, '.trans-item__comment');

        const res = await evaluate((elem, commentEl) => ({
            id: parseInt(elem.dataset.id, 10),
            type: parseInt(elem.dataset.type, 10),
            selected: elem.classList.contains('trans-item_selected'),
            detailsMode: elem.classList.contains('trans-item_details'),
            comment: (commentEl) ? commentEl.textContent : '',
        }), this.elem, commentElem);

        if (res.detailsMode) {
            const [
                srcAccountElem,
                destAccountElem,
            ] = await queryAll(this.elem, '.trans-item__account-field .field__content');
            const [
                srcAmountElem,
                destAmountElem,
            ] = await queryAll(this.elem, '.trans-item__amount-field .field__content');
            const dateElem = await query(this.elem, '.trans-item__date-field .field__content');

            const sourceVisible = await isVisible(srcAccountElem, true);
            const destVisible = await isVisible(destAccountElem, true);
            const srcAmountVisible = await isVisible(srcAmountElem, true);
            const destAmountVisible = await isVisible(destAmountElem, true);

            const props = await evaluate((sAccount, dAccount, sAmount, dAmount, dateEl) => ({
                sourceContent: sAccount.textContent,
                destContent: dAccount.textContent,
                srcAmount: sAmount.textContent,
                destAmount: dAmount.textContent,
                dateFmt: dateEl.textContent,
            }), srcAccountElem, destAccountElem, srcAmountElem, destAmountElem, dateElem);

            if (sourceVisible && destVisible) {
                res.accountTitle = `${props.sourceContent} → ${props.destContent}`;
            } else {
                res.accountTitle = (sourceVisible) ? props.sourceContent : props.destContent;
            }

            let sign;
            if (res.type === EXPENSE) {
                sign = '- ';
            }
            if (res.type === INCOME) {
                sign = '+ ';
            }
            if (res.type === TRANSFER || res.type === DEBT) {
                sign = '';
            }

            if (srcAmountVisible && destAmountVisible) {
                res.amountText = `${sign}${props.srcAmount} (${sign}${props.destAmount})`;
            } else {
                res.amountText = props.srcAmount;
            }

            res.dateFmt = props.dateFmt;
        } else {
            const titleElem = await query(this.elem, '.trans-item__title');
            assert(titleElem, 'Account title not found');
            const amountElem = await query(this.elem, '.trans-item__amount');
            assert(amountElem, 'Amount text not found');
            const dateElem = await query(this.elem, '.trans-item__date');

            const props = await evaluate((titleEl, amountEl, dateEl) => ({
                accountTitle: titleEl.textContent,
                amountText: amountEl.textContent,
                dateFmt: dateEl.textContent,
            }), titleElem, amountElem, dateElem);
            Object.assign(res, props);
        }

        res.menuBtn = await query(this.elem, '.popup-menu-btn');

        return res;
    }

    get id() {
        return this.content.id;
    }

    async click() {
        return click(this.elem);
    }

    async clickMenu() {
        return click(this.content.menuBtn);
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
            res.amountText = srcAmountFmt;
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

            let sign = '';
            if (debtType) {
                res.accountTitle = person.name;
                if (acc) {
                    res.accountTitle += ` → ${acc.name}`;
                } else {
                    sign = '- ';
                }
            } else {
                if (acc) {
                    res.accountTitle = `${acc.name} → `;
                } else {
                    sign = '+ ';
                }
                res.accountTitle += person.name;
            }

            res.amountText = `${sign}${srcAmountFmt}`;
            if (transaction.src_curr !== transaction.dest_curr) {
                res.amountText += ` (${sign}${destAmountFmt})`;
            }
        }

        res.dateFmt = Transaction.formatDate(transaction.date);
        res.comment = transaction.comment;

        return res;
    }
}
