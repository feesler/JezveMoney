import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    onSubmit: null,
};

export class UpcomingRemindersListForm extends ApiRequestForm {
    constructor(props) {
        super({
            ...defaultProps,
            ...props,
            title: 'Upcoming reminders',
            action: `${App.baseURL}api/reminder/upcoming`,
            optionalFields: [
                { title: 'Items on page', name: 'onPage' },
                { title: 'Page number', name: 'page' },
                { title: 'Pages range', name: 'range' },
                { title: 'Start date', name: 'startDate' },
                { title: 'End date', name: 'endDate' },
            ],
        });
    }
}
