import { createElement } from 'jezvejs';
import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const generalFields = [
    { title: 'Type', name: 'type' },
    { title: 'Source account', name: 'src_id' },
    { title: 'Destination account', name: 'dest_id' },
];

const debtFields = [
    { title: 'Person id', name: 'person_id' },
    { title: 'Account id', name: 'acc_id' },
    { title: 'Debt operation (1 or 2)', name: 'op' },
];

const defaultProps = {
    isUpdate: false,
    isDebt: false,
};

export class TransactionForm extends ApiRequestForm {
    static createHiddenTypeInput(value) {
        return createElement('input', {
            props: {
                type: 'hidden',
                name: 'type',
                value,
            },
        });
    }

    constructor(props = {}) {
        const { isUpdate = false, isDebt = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/transaction/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                ...((isDebt) ? debtFields : generalFields),
                { title: 'Source amount', name: 'src_amount' },
                { title: 'Destination amount', name: 'dest_amount' },
                { title: 'Source currency', name: 'src_curr' },
                { title: 'Destination currency', name: 'dest_curr' },
                { title: 'Date', name: 'date' },
                { title: 'Category', name: 'category_id' },
                { title: 'Comment', name: 'comment' },
            ],
            optionalFields: [
                ...((!isUpdate) ? [{ title: 'Reminder', name: 'reminder_id' }] : []),
            ],
            additionalFields: [
                (isDebt) ? TransactionForm.createHiddenTypeInput(4) : null,
            ],
            returnStateField: true,
        });
    }
}
