import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    onSubmit: null,
};

export class RemindersListForm extends ApiRequestForm {
    constructor(props) {
        super({
            ...defaultProps,
            ...props,
            title: 'List reminders',
            action: `${App.baseURL}api/reminder/list`,
            optionalFields: [
                { title: 'Schedule id', name: 'schedule_id' },
                { title: 'State', name: 'state' },
                { title: 'Date', name: 'date' },
                { title: 'Transaction id', name: 'transaction_id' },
            ],
        });
    }
}
