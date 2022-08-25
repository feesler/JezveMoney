/** Types of transactions */
export const EXPENSE = 1;
export const INCOME = 2;
export const TRANSFER = 3;
export const DEBT = 4;

const availTransTypes = {
    [EXPENSE]: 'expense',
    [INCOME]: 'income',
    [TRANSFER]: 'transfer',
    [DEBT]: 'debt',
};

export class Transaction {
    /** Return string for specified transaction type */
    static getTypeString(value) {
        const type = parseInt(value, 10);
        if (!availTransTypes[type]) {
            return null;
        }

        return availTransTypes[type];
    }
}
