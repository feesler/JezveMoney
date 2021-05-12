import { amountFix, timestampFromString } from '../app.js';
import { ListItem } from './ListItem.js';

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
        const availFields = ['id', 'name', 'type_id', 'columns'];

        return typeof field === 'string' && availFields.includes(field);
    }

    /**
     * Search for column with specified index in the template
     * Return information object if column found else null is returned
     * @param {number} index - column index in raw data
     */
    getColumnsByIndex(index) {
        const tplColumns = {
            accountAmount: { title: 'Account amount' },
            accountCurrency: { title: 'Account currency' },
            transactionAmount: { title: 'Transaction amount' },
            transactionCurrency: { title: 'Transaction currency' },
            date: { title: 'Date' },
            comment: { title: 'Comment' },
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
        return timestampFromString(value);
    }

    /** Extract comment value from data */
    getComment(data) {
        if (!('comment' in this.columns)) {
            return null;
        }

        return this.getColumnData(data, this.columns.comment);
    }

    /** Apply import template to specified data row */
    applyTo(data, currencyModel) {
        const res = {
            accountAmount: this.getAccountAmount(data),
            accountCurrency: this.getAccountCurrency(data),
            transactionAmount: this.getTransactionAmount(data),
            transactionCurrency: this.getTransactionCurrency(data),
            date: this.getDate(data),
            comment: this.getComment(data),
            template: this.id,
        };

        const accCurrency = currencyModel.findByName(res.accountCurrency);
        res.accountCurrencyId = (accCurrency) ? accCurrency.id : null;

        const trCurrency = currencyModel.findByName(res.transactionCurrency);
        res.transactionCurrencyId = (trCurrency) ? trCurrency.id : null;

        return res;
    }
}
