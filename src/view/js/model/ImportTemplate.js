import { fixFloat } from 'jezvejs';
import {
    amountFix,
    timestampFromString,
    __,
} from '../utils.js';
import { ImportTemplateError } from '../error/ImportTemplateError.js';
import { ListItem } from './ListItem.js';

export const IMPORT_DATE_LOCALE = 'ru';

/**
 * Import template class
 * @param {object} props - properties of instance
 */
export class ImportTemplate extends ListItem {
    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = ['id', 'name', 'account_id', 'type_id', 'first_row', 'columns'];

        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Search for column with specified index in the template
     * Return information object if column found else null is returned
     * @param {number} index - column index in raw data
     */
    getColumnsByIndex(index) {
        const tplColumns = {
            accountAmount: { title: __('COLUMN_ACCOUNT_AMOUNT') },
            accountCurrency: { title: __('COLUMN_ACCOUNT_CURRENCY') },
            transactionAmount: { title: __('COLUMN_TR_AMOUNT') },
            transactionCurrency: { title: __('COLUMN_TR_CURRENCY') },
            date: { title: __('COLUMN_DATE') },
            comment: { title: __('COLUMN_COMMENT') },
        };

        const res = Object.keys(tplColumns)
            .filter((columnName) => this.columns[columnName] === index);

        return res.map((columnName) => tplColumns[columnName]);
    }

    /**
     * Return column data by specified index
     * @param {Array} data - row data array
     * @param {number} index - column index, starting from 1
     */
    getColumnData(data, index) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid row data');
        }

        const col = parseInt(index, 10);
        if (Number.isNaN(col) || col < 1 || col > data.length) {
            throw new Error(`Invalid column ${index}. Total columns: ${data.length}`);
        }

        return data[col - 1];
    }

    /** Obtain specified property from data */
    getProperty(name, data, safe) {
        const propGetterMap = {
            accountAmount: this.getAccountAmount,
            accountCurrency: this.getAccountCurrency,
            transactionAmount: this.getTransactionAmount,
            transactionCurrency: this.getTransactionCurrency,
            date: this.getDate,
            comment: this.getComment,
        };

        try {
            if (!(name in propGetterMap)) {
                throw new Error('Invalid property');
            }

            return propGetterMap[name].call(this, data);
        } catch (e) {
            if (safe) {
                return null;
            }

            throw e;
        }
    }

    /** Extract account amount value from data */
    getAccountAmount(data) {
        if (!('accountAmount' in this.columns)) {
            return null;
        }

        const value = this.getColumnData(data, this.columns.accountAmount);
        return amountFix(value);
    }

    /** Extract account currency value from data */
    getAccountCurrency(data) {
        if (!('accountCurrency' in this.columns)) {
            return null;
        }

        return this.getColumnData(data, this.columns.accountCurrency);
    }

    /** Extract transaction amount value from data */
    getTransactionAmount(data) {
        if (!('transactionAmount' in this.columns)) {
            return null;
        }

        const value = this.getColumnData(data, this.columns.transactionAmount);
        return amountFix(value);
    }

    /** Extract transaction currency value from data */
    getTransactionCurrency(data) {
        if (!('transactionCurrency' in this.columns)) {
            return null;
        }

        return this.getColumnData(data, this.columns.transactionCurrency);
    }

    /** Extract date value from data */
    getDate(data) {
        if (!('date' in this.columns)) {
            return null;
        }

        const value = this.getColumnData(data, this.columns.date);
        return timestampFromString(value, { locales: IMPORT_DATE_LOCALE });
    }

    /** Extract comment value from data */
    getComment(data) {
        if (!('comment' in this.columns)) {
            return null;
        }

        return this.getColumnData(data, this.columns.comment);
    }

    /** Apply import template to specified data row */
    convertRow(data, mainAccount) {
        const currencyModel = window.app.model.currency;
        const res = {
            mainAccount,
            accountAmount: this.getAccountAmount(data),
            accountCurrency: this.getAccountCurrency(data),
            transactionAmount: this.getTransactionAmount(data),
            transactionCurrency: this.getTransactionCurrency(data),
            date: this.getDate(data),
            comment: this.getComment(data),
            template: this.id,
        };

        const accCurrency = currencyModel.findByCode(res.accountCurrency);
        res.accountCurrencyId = (accCurrency) ? accCurrency.id : null;

        // Check account currency is same as at main account
        if (res.accountCurrencyId !== mainAccount.curr_id) {
            throw new ImportTemplateError(__('ERR_CONVERT_ACCOUNT_CURRENCY'), 'accountCurrency');
        }

        const trCurrency = currencyModel.findByCode(res.transactionCurrency);
        res.transactionCurrencyId = (trCurrency) ? trCurrency.id : null;

        const amount = parseFloat(fixFloat(res.accountAmount));
        if (Number.isNaN(amount) || amount === 0) {
            throw new ImportTemplateError(__('ERR_CONVERT_ACCOUNT_AMOUNT'), 'accountAmount');
        }

        const trAmount = parseFloat(fixFloat(res.transactionAmount));
        if (Number.isNaN(trAmount) || trAmount === 0) {
            throw new ImportTemplateError(__('ERR_CONVERT_TR_AMOUNT'), 'accountAmount');
        }

        return res;
    }

    /** Apply import template to specified data */
    applyTo(data, mainAccount) {
        const rows = data.slice(this.first_row - 1);
        const res = rows.map((item) => this.convertRow(item, mainAccount));
        return res;
    }
}
