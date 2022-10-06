import {
    TestComponent,
    query,
    queryAll,
    prop,
    assert,
    formatDate,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { asyncMap } from '../../../common.js';
import { ImportTemplate } from '../../../model/ImportTemplate.js';

const labelsMap = {
    mainAccount: 'Main account',
    template: 'Template',
    transactionAmount: 'Tr. amount',
    transactionCurrency: 'Tr. currency',
    accountAmount: 'Acc. amount',
    accountCurrency: 'Acc. currency',
    comment: 'Comment',
    date: 'Date',
};

export class OriginalImportData extends TestComponent {
    async parseContent() {
        const res = {};

        const dataValues = await queryAll(this.elem, '.column');
        const dataColumns = await asyncMap(dataValues, (elem) => this.parseDataColumn(elem));
        dataColumns.forEach(({ value, property }) => {
            res[property] = value;
        });

        const valid = Object.keys(labelsMap).every((key) => key in res);
        assert(valid, 'Invalid structure of import item');

        return res;
    }

    async parseDataColumn(elem) {
        assert(elem, 'Invalid element');

        const labelElem = await query(elem, '.column__header');
        const valueElem = await query(elem, '.column__data');
        assert(labelElem && valueElem, 'Invalid structure of import item');

        const label = await prop(labelElem, 'textContent');
        const value = await prop(valueElem, 'textContent');
        const property = Object.keys(labelsMap).find((key) => label === labelsMap[key]);

        assert(property, `Invalid label: '${label}'`);

        return { value, property };
    }

    async buildModel(cont) {
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
