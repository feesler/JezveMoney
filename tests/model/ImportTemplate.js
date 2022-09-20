import { assert, copyObject, formatDate } from 'jezve-test';
import { fixFloat, fixDate } from '../common.js';
import { ImportTransaction } from './ImportTransaction.js';
import { ImportTemplateError } from '../error/ImportTemplateError.js';
import { App } from '../Application.js';

const tplColumns = [
    'accountAmount',
    'accountCurrency',
    'transactionAmount',
    'transactionCurrency',
    'date',
    'comment',
];

/** Import template model */
export class ImportTemplate {
    constructor(data) {
        assert(data, 'Invalid data');

        this.id = data.id;
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
        return (timestamp) ? (new Date(timestamp)) : null;
    }

    /** Extract specified column data from raw data row */
    static getColumn(row, colInd) {
        const col = parseInt(colInd, 10);
        assert.arrayIndex(row, col - 1, `Invalid column ${colInd}. Total columns: ${row.length}`);

        return row[col - 1];
    }

    getRowData(row) {
        const res = {};

        tplColumns.forEach((column) => {
            assert(column in this.columns, `Column '${column}' not found`);

            let value = ImportTemplate.getColumn(row, this.columns[column]);

            if (['accountAmount', 'transactionAmount'].includes(column)) {
                value = ImportTemplate.amountFix(value);
            } else if (column === 'date') {
                value = formatDate(ImportTemplate.dateFromString(value));
            }

            res[column] = value;
        });

        return res;
    }

    isValid(data) {
        assert.isArray(data, 'Invalid data');

        try {
            const [row] = data.slice(1, 2);
            const rowData = this.getRowData(row);

            const accCurrency = App.currency.findByName(rowData.accountCurrency);
            if (!accCurrency) {
                return false;
            }
            const trCurrency = App.currency.findByName(rowData.transactionCurrency);
            if (!trCurrency) {
                return false;
            }
            if (
                Number.isNaN(rowData.accountAmount)
                || rowData.accountAmount === 0
                || Number.isNaN(rowData.transactionAmount)
                || rowData.transactionAmount === 0
                || rowData.date == null
            ) {
                return false;
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    /**
    * Apply import template to raw data of uploaded file and return
    * @param {string[][]} data - raw data from uploaded file
    * @param {ImportTemplate} template - import template object
    * @param {Account} mainAccount - main account object
    */
    applyTo(data, mainAccount) {
        const skipRows = 1;

        assert.isArray(data, 'Invalid parameters');
        assert(mainAccount, 'Invalid parameters');

        const res = [];
        try {
            data.forEach((row, ind) => {
                if (ind < skipRows) {
                    return;
                }

                const rowData = this.getRowData(row);
                const original = {
                    ...rowData,
                    mainAccount,
                    template: this.id,
                };

                const accCurrency = App.currency.findByName(original.accountCurrency);
                original.accountCurrencyId = accCurrency ? accCurrency.id : null;
                if (original.accountCurrencyId !== mainAccount.curr_id) {
                    throw new ImportTemplateError();
                }

                const trCurrency = App.currency.findByName(original.transactionCurrency);
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
