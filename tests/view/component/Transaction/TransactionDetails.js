import {
    TestComponent,
    query,
    click,
    assert,
    evaluate,
    prop,
    asyncMap,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { secondsToDateString } from '../../../common.js';
import { __ } from '../../../model/locale.js';
import { Transaction } from '../../../model/Transaction.js';

const fieldSelectors = [
    '.source-field',
    '.destination-field',
    '.src-amount-field',
    '.dest-amount-field',
    '.src-result-field',
    '.dest-result-field',
    '.date-field',
    '.category-field',
    '.comment-field',
    '.create-date-field',
    '.update-date-field',
];

export class TransactionDetails extends TestComponent {
    async parseContent() {
        const res = {
            closeBtn: { elem: await query(this.elem, '.close-btn') },
            title: { elem: await query(this.elem, '.heading h1') },
        };
        res.title.value = await prop(res.title.elem, 'textContent');

        [
            res.sourceField,
            res.destinationField,
            res.srcAmountField,
            res.destAmountField,
            res.srcResultField,
            res.destResultField,
            res.dateField,
            res.categoryField,
            res.commentField,
            res.createDateField,
            res.updateDateField,
        ] = await asyncMap(fieldSelectors, async (selector) => (
            this.parseField(await query(this.elem, selector))
        ));

        return res;
    }

    async parseField(elem) {
        assert(elem, 'Invalid field element');

        const titleElem = await query(elem, '.field__title');
        const contentElem = await query(elem, '.field__content');
        assert(titleElem && contentElem, 'Invalid structure of field');

        const res = await evaluate((titleEl, contEl) => ({
            title: titleEl.textContent,
            value: contEl.textContent,
        }), titleElem, contentElem);
        res.elem = elem;

        return res;
    }

    async close() {
        return click(this.content.closeBtn.elem);
    }

    static getAccountOrPerson(accountId, state) {
        const { profile, accounts, persons } = state;
        const account = accounts.getItem(accountId);
        if (!account) {
            return null;
        }
        if (account.owner_id === profile.owner_id) {
            return account.name;
        }

        const person = persons.getItem(account.owner_id);
        return person.name;
    }

    static render(item, state) {
        const srcCurr = App.currency.getItem(item.src_curr);
        assert(srcCurr, `Currency not found: ${item.src_curr}`);
        const destCurr = App.currency.getItem(item.dest_curr);
        assert(destCurr, `Currency not found: ${item.dest_curr}`);

        const showSource = item.src_id !== 0;
        const showDest = item.dest_id !== 0;
        const isDiff = item.src_curr !== item.dest_curr;

        const category = state.categories.getItem(item.category_id);
        const categoryTitle = (category)
            ? category.name
            : __('NO_CATEGORY', App.view.locale);

        const res = {
            title: {
                visible: true,
                value: Transaction.typeToString(item.type, App.view.locale),
            },
            sourceField: {
                visible: showSource,
            },
            destinationField: {
                visible: showDest,
            },
            srcAmountField: {
                visible: true,
                value: srcCurr.format(item.src_amount),
            },
            destAmountField: {
                visible: isDiff,
            },
            srcResultField: {
                visible: showSource,
            },
            destResultField: {
                visible: showDest,
            },
            dateField: {
                visible: true,
                value: secondsToDateString(item.date),
            },
            categoryField: {
                visible: true,
                value: categoryTitle,
            },
            commentField: {
                visible: true,
                value: item.comment,
            },
            createDateField: {
                value: secondsToDateString(item.createdate),
                visible: true,
            },
            updateDateField: {
                value: secondsToDateString(item.updatedate),
                visible: true,
            },
        };

        if (showSource) {
            res.sourceField.value = this.getAccountOrPerson(item.src_id, state);
            res.srcResultField.value = srcCurr.format(item.src_result);
        }
        if (showDest) {
            res.destinationField.value = this.getAccountOrPerson(item.dest_id, state);
            res.destResultField.value = destCurr.format(item.dest_result);
        }
        if (isDiff) {
            res.destAmountField.value = destCurr.format(item.dest_amount);
        }

        return res;
    }
}
