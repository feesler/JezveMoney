import {
    TestComponent,
    assert,
    formatDate,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { IMPORT_DATE_LOCALE, ImportTemplate } from '../../../model/ImportTemplate.js';
import { __ } from '../../../model/locale.js';

export class OriginalImportData extends TestComponent {
    getLabelsMap() {
        return {
            mainAccount: __('IMPORT_MAIN_ACCOUNT', App.view.locale),
            template: __('TEMPLATE', App.view.locale),
            accountAmount: __('COLUMN_ACCOUNT_AMOUNT', App.view.locale),
            transactionAmount: __('COLUMN_TR_AMOUNT', App.view.locale),
            accountCurrency: __('COLUMN_ACCOUNT_CURRENCY', App.view.locale),
            transactionCurrency: __('COLUMN_TR_CURRENCY', App.view.locale),
            date: __('COLUMN_DATE', App.view.locale),
            comment: __('COLUMN_COMMENT', App.view.locale),
        };
    }

    async parseContent() {
        const labelsMap = this.getLabelsMap();

        const res = await evaluate((el, labels) => {
            const columns = {};
            const columnKeys = Object.keys(labels);

            const columnElems = el.querySelectorAll('.column');
            columnElems.forEach((columnEl) => {
                const labelEl = columnEl.querySelector('.column__header');
                const valueEl = columnEl.querySelector('.column__data');
                const label = labelEl?.textContent;

                const property = columnKeys.find((key) => label === labels[key]);
                if (property) {
                    columns[property] = valueEl?.textContent;
                }
            });

            return columns;
        }, this.elem, labelsMap);

        const valid = Object.keys(labelsMap).every((key) => (key in res));
        assert(valid, 'Invalid structure of import item');

        return res;
    }

    buildModel(cont) {
        const res = {
            ...cont,
            accountAmount: ImportTemplate.amountFix(cont.accountAmount),
            transactionAmount: ImportTemplate.amountFix(cont.transactionAmount),
            date: formatDate(
                ImportTemplate.dateFromString(cont.date),
                IMPORT_DATE_LOCALE,
                App.dateFormatOptions,
            ),
        };

        const template = App.state.templates.find((item) => item.name === cont.template);
        assert(template, `Template '${cont.template}' not found`);
        res.template = template.id;

        res.origAccount = App.state.accounts.findByName(res.mainAccount);
        assert(res.origAccount, `Account ${res.mainAccount} not found`);

        return res;
    }
}
