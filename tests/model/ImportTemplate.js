import { copyObject } from 'jezvejs';
import { assert } from 'jezve-test';
import { formatDate } from 'jezvejs/DateUtils';
import { fixFloat, fixDate } from '../common.js';
import { Currency } from './Currency.js';
import { ImportTransaction } from './ImportTransaction.js';
import { ImportTemplateError } from '../error/ImportTemplateError.js';

/** Import template model */
export class ImportTemplate {
    constructor(data) {
        if (!data) {
            throw new Error('Invalid data');
        }

        this.name = data.name;
        this.type_id = data.type_id;
        this.columns = copyObject(data.columns);
    }

    /** Fix amount value from raw data */
    static amountFix(value) {
        const res = value.replace(/ /, '');
        return parseFloat(fixFloat(res));
    }

    /** Obtain date value from raw data */
    static dateFromString(str) {
        let tmpDate = str;
        const pos = str.indexOf(' ');
        if (pos !== -1) {
            tmpDate = tmpDate.substr(0, pos);
        }

        const timestamp = fixDate(tmpDate);
        return new Date(timestamp);
    }

    /** Extract specified column data from raw data row */
    static getColumn(row, colInd) {
        const col = parseInt(colInd, 10);
        assert.arrayIndex(row, col - 1, `Invalid column ${colInd}. Total columns: ${row.length}`);

        return row[col - 1];
    }

    /**
    * Apply import template to raw data of uploaded file and return
    * @param {string[][]} data - raw data from uploaded file
    * @param {ImportTemplate} template - import template object
    * @param {Account} mainAccount - main account object
    */
    applyTo(data, mainAccount) {
        const columns = [
            'accountAmount',
            'accountCurrency',
            'transactionAmount',
            'transactionCurrency',
            'date',
            'comment',
        ];
        const skipRows = 1;

        if (!Array.isArray(data) || !mainAccount) {
            throw new Error('Invalid parameters');
        }

        const res = [];
        try {
            data.forEach((row, ind) => {
                if (ind < skipRows) {
                    return;
                }

                const original = { mainAccount };
                columns.forEach((column) => {
                    if (!(column in this.columns)) {
                        throw new Error(`Column '${column}' not found`);
                    }

                    let value = ImportTemplate.getColumn(row, this.columns[column]);

                    if (['accountAmount', 'transactionAmount'].includes(column)) {
                        value = ImportTemplate.amountFix(value);
                    } else if (column === 'date') {
                        value = formatDate(ImportTemplate.dateFromString(value));
                    }

                    original[column] = value;
                });

                const accCurrency = Currency.findByName(original.accountCurrency);
                original.accountCurrencyId = accCurrency ? accCurrency.id : null;
                if (original.accountCurrencyId !== mainAccount.curr_id) {
                    throw new ImportTemplateError();
                }

                const trCurrency = Currency.findByName(original.transactionCurrency);
                original.transactionCurrencyId = trCurrency ? trCurrency.id : null;

                if (Number.isNaN(original.accountAmount) || original.accountAmount === 0) {
                    throw new ImportTemplateError();
                }
                if (Number.isNaN(original.transactionAmount) || original.transactionAmount === 0) {
                    throw new ImportTemplateError();
                }

                const item = ImportTransaction.fromImportData(original, mainAccount);

                res.push(item);
            });
        } catch (e) {
            if (!(e instanceof ImportTemplateError)) {
                throw e;
            }

            return null;
        }

        return res;
    }
}
