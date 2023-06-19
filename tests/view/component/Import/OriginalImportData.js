import {
    TestComponent,
    assert,
    evaluate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
import { __ } from '../../../model/locale.js';

export class OriginalImportData extends TestComponent {
    getLabelsMap() {
        return {
            mainAccount: __('import.mainAccount', App.view.locale),
            template: __('import.templates.title', App.view.locale),
            accountAmount: __('import.templates.columns.accountAmount', App.view.locale),
            transactionAmount: __('import.templates.columns.transactionAmount', App.view.locale),
            accountCurrency: __('import.templates.columns.accountCurrency', App.view.locale),
            transactionCurrency: __('import.templates.columns.transactionCurrency', App.view.locale),
            date: __('import.templates.columns.date', App.view.locale),
            comment: __('import.templates.columns.comment', App.view.locale),
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
        };

        const template = App.state.templates.find((item) => item.name === cont.template);
        assert(template, `Template '${cont.template}' not found`);
        res.template = template.id;

        res.origAccount = App.state.accounts.findByName(res.mainAccount);
        assert(res.origAccount, `Account ${res.mainAccount} not found`);

        res.date = ImportTemplate.dateFromString(cont.date, template.date_locale);

        return res;
    }
}
