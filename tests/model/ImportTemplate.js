import { copyObject, formatDate } from 'jezve-test';
import { fixFloat, fixDate } from '../common.js';
import { Currency } from './Currency.js';
import { ImportTransaction } from './ImportTransaction.js';

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
        if (!Array.isArray(row)) {
            throw new Error('Invalid row');
        }

        const col = parseInt(colInd, 10);
        if (Number.isNaN(col) || col < 1 || col > row.length) {
            throw new Error(`Invalid column ${colInd}. Total columns: ${row.length}`);
        }

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

            const trCurrency = Currency.findByName(original.transactionCurrency);
            original.transactionCurrencyId = trCurrency ? trCurrency.id : null;

            const item = ImportTransaction.fromImportData(original, mainAccount);

            res.push(item);
        });

        return res;
    }
}
