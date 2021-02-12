import {
    copyObject,
    fixFloat,
    fixDate,
    formatDate,
} from '../common.js';
import { Currency } from './currency.js';
import { ImportTransaction } from './importtransaction.js';

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

            const accAmount = ImportTemplate.getColumn(row, this.columns.accountAmount);
            original.accAmountVal = ImportTemplate.amountFix(accAmount);
            if (!original.accAmountVal) {
                return;
            }
            original.accCurrVal = ImportTemplate.getColumn(row, this.columns.accountCurrency);
            original.accCurr = Currency.findByName(original.accCurrVal);
            if (!original.accCurr) {
                console.log(`Currency ${original.accCurrVal} not found`);
                return;
            }

            const trAmount = ImportTemplate.getColumn(row, this.columns.transactionAmount);
            original.trAmountVal = ImportTemplate.amountFix(trAmount);
            if (!original.accAmountVal) {
                return;
            }
            original.trCurrVal = ImportTemplate.getColumn(row, this.columns.transactionCurrency);
            original.trCurr = Currency.findByName(original.trCurrVal);
            if (!original.trCurr) {
                console.log(`Currency ${original.trCurrVal} not found`);
                return;
            }

            original.date = ImportTemplate.dateFromString(
                ImportTemplate.getColumn(row, this.columns.date),
            );
            original.date = formatDate(original.date);

            original.comment = ImportTemplate.getColumn(row, this.columns.comment);

            const item = ImportTransaction.fromImportData(original, mainAccount);

            res.push(item);
        });

        return res;
    }
}
