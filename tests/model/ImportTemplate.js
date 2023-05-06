import { assert, copyObject, isDate } from 'jezve-test';
import { fixFloat, fixDate } from '../common.js';
import { ImportTransaction } from './ImportTransaction.js';
import { ImportTemplateError } from '../error/ImportTemplateError.js';
import { App } from '../Application.js';

export const tplColumns = [
    'accountAmount',
    'transactionAmount',
    'accountCurrency',
    'transactionCurrency',
    'date',
    'comment',
];

export const IMPORT_DATE_LOCALE = 'ru';

const amountColumns = ['accountAmount', 'transactionAmount'];
const currencyColumns = ['accountCurrency', 'transactionCurrency'];

/** Import template model */
export class ImportTemplate {
    constructor(data) {
        assert(data, 'Invalid data');

        this.id = data.id;
        this.name = data.name;
        this.type_id = data.type_id;
        this.account_id = data.account_id;
        this.first_row = data.first_row;
        this.date_locale = data.date_locale;
        this.columns = copyObject(data.columns);
    }

    /** Fix amount value from raw data */
    static amountFix(value) {
        const res = value.replace(/ /, '');
        return parseFloat(fixFloat(res));
    }

    /** Obtain date value from raw data */
    static dateFromString(str, locales = []) {
        let tmpDate = str;
        const pos = str.indexOf(' ');
        if (pos !== -1) {
            tmpDate = tmpDate.substring(0, pos);
        }

        const timestamp = fixDate(tmpDate, { locales });
        return (timestamp) ? (new Date(timestamp)) : null;
    }

    static isValidAmount(value) {
        const amount = this.amountFix(value);
        return !Number.isNaN(amount) && amount !== 0;
    }

    static isValidCurrency(value) {
        return App.currency.findByCode(value);
    }

    static isValidDate(value, locale) {
        const date = this.dateFromString(value, locale);
        return isDate(date);
    }

    /** Extract specified column data from raw data row */
    static getColumn(row, colInd, safe = false) {
        try {
            const col = parseInt(colInd, 10);
            assert.arrayIndex(row, col - 1, `Invalid column ${colInd}. Total columns: ${row.length}`);
            return row[col - 1];
        } catch (e) {
            if (safe) {
                return null;
            }

            throw e;
        }
    }

    getRowData(row) {
        const res = {};

        tplColumns.forEach((column) => {
            assert(column in this.columns, `Column '${column}' not found`);

            let value = ImportTemplate.getColumn(row, this.columns[column]);

            if (amountColumns.includes(column)) {
                value = ImportTemplate.amountFix(value);
            } else if (column === 'date') {
                value = ImportTemplate.dateFromString(value, this.date_locale);
            }

            res[column] = value;
        });

        return res;
    }

    getFirstInvalidColumn(data) {
        assert.isArray(data, 'Invalid data');

        const start = this.first_row - 1;
        const [row] = data.slice(start, start + 1);

        const res = tplColumns.find((column) => {
            const value = ImportTemplate.getColumn(row, this.columns[column], true);
            return (
                (value === null)
                || (amountColumns.includes(column) && !ImportTemplate.isValidAmount(value))
                || (currencyColumns.includes(column) && !ImportTemplate.isValidCurrency(value))
                || (column === 'date' && !ImportTemplate.isValidDate(value, this.date_locale))
            );
        });

        return res ?? null;
    }

    isValid(data) {
        if (!this.columns) {
            return false;
        }

        if (typeof this.name !== 'string' || this.name.length === 0) {
            return false;
        }

        if (Number.isNaN(this.first_row) || this.first_row < 1) {
            return false;
        }

        return (this.getFirstInvalidColumn(data) === null);
    }

    /**
    * Apply import template to raw data of uploaded file and return
    * @param {string[][]} data - raw data from uploaded file
    * @param {ImportTemplate} template - import template object
    * @param {Account} mainAccount - main account object
    */
    applyTo(data, mainAccount) {
        assert.isArray(data, 'Invalid parameters');
        assert(mainAccount, 'Invalid parameters');

        try {
            const rows = data.slice(this.first_row - 1);
            const res = rows.map((row) => {
                const rowData = this.getRowData(row);
                const original = {
                    ...rowData,
                    mainAccount,
                    origAccount: { ...mainAccount },
                    template: this.id,
                };

                const accCurrency = App.currency.findByCode(original.accountCurrency);
                original.accountCurrencyId = accCurrency ? accCurrency.id : null;
                if (original.accountCurrencyId !== mainAccount.curr_id) {
                    throw new ImportTemplateError();
                }

                const trCurrency = App.currency.findByCode(original.transactionCurrency);
                original.transactionCurrencyId = trCurrency ? trCurrency.id : null;

                if (Number.isNaN(original.accountAmount) || original.accountAmount === 0) {
                    throw new ImportTemplateError();
                }
                if (Number.isNaN(original.transactionAmount) || original.transactionAmount === 0) {
                    throw new ImportTemplateError();
                }

                return ImportTransaction.fromImportData(original, mainAccount);
            });

            return res;
        } catch (e) {
            if (!(e instanceof ImportTemplateError)) {
                throw e;
            }

            return null;
        }
    }
}
