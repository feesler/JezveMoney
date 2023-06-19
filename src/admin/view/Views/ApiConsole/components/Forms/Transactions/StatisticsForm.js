import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    onSubmit: null,
};

export class StatisticsForm extends ApiRequestForm {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            title: 'Statistics',
            action: `${App.baseURL}api/transaction/statistics`,
            method: 'get',
            inputFields: [
                { title: 'Types', name: 'type' },
                { title: 'Report type (category, account, currency)', name: 'report' },
                { title: 'Group by (day, week, month, year)', name: 'group' },
            ],
            optionalFields: [
                { title: 'Currency', name: 'curr_id' },
                { title: 'Account ids', name: 'accounts' },
                { title: 'Category ids', name: 'categories' },
                { title: 'Start date', name: 'startDate' },
                { title: 'End date', name: 'endDate' },
            ],
        });
    }
}
