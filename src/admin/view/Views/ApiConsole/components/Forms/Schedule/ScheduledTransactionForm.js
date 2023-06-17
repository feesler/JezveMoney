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

export class ScheduledTransactionForm extends ApiRequestForm {
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
            action: `${App.baseURL}api/schedule/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                ...((isDebt) ? debtFields : generalFields),
                { title: 'Source amount', name: 'src_amount' },
                { title: 'Destination amount', name: 'dest_amount' },
                { title: 'Source currency', name: 'src_curr' },
                { title: 'Destination currency', name: 'dest_curr' },
                { title: 'Category', name: 'category_id' },
                { title: 'Comment', name: 'comment' },
                { title: 'Start date', name: 'start_date' },
                { title: 'End date', name: 'end_date' },
                { title: 'Interval type (0-4)', name: 'interval_type' },
                { title: 'Interval step', name: 'interval_step' },
                { title: 'Interval offset', name: 'interval_offset' },
            ],
            additionalFields: [
                (isDebt) ? ScheduledTransactionForm.createHiddenTypeInput(4) : null,
            ],
            returnStateField: true,
        });
    }
}
