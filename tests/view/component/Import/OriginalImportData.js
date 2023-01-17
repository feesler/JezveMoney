import {
    TestComponent,
    query,
    queryAll,
    assert,
    formatDate,
    evaluate,
    asyncMap,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';
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
        const res = {};

        const dataValues = await queryAll(this.elem, '.column');
        const dataColumns = await asyncMap(dataValues, (elem) => this.parseDataColumn(elem));
        dataColumns.forEach(({ value, property }) => {
            res[property] = value;
        });

        const labelsMap = this.getLabelsMap();
        const valid = Object.keys(labelsMap).every((key) => key in res);
        assert(valid, 'Invalid structure of import item');

        return res;
    }

    async parseDataColumn(elem) {
        assert(elem, 'Invalid element');

        const labelElem = await query(elem, '.column__header');
        const valueElem = await query(elem, '.column__data');
        assert(labelElem && valueElem, 'Invalid structure of import item');

        const res = await evaluate((labelEl, valueEl) => ({
            label: labelEl.textContent,
            value: valueEl.textContent,
        }), labelElem, valueElem);

        const labelsMap = this.getLabelsMap();
        res.property = Object.keys(labelsMap).find((key) => res.label === labelsMap[key]);
        assert(res.property, `Invalid label: '${res.label}'`);

        return res;
    }

    buildModel(cont) {
        const res = {
            ...cont,
            accountAmount: ImportTemplate.amountFix(cont.accountAmount),
            transactionAmount: ImportTemplate.amountFix(cont.transactionAmount),
            date: formatDate(
                ImportTemplate.dateFromString(cont.date),
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
