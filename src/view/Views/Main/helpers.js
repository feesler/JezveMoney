import { asArray } from '@jezvejs/types';

export const getTransactionListContextIds = (state) => (
    asArray(state?.transactionContextItem)
);
