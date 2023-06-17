import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class ImportActionForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/importaction/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Parent rule id', name: 'rule_id' },
                { title: 'Action type (1-6)', name: 'action_id' },
                { title: 'Value', name: 'value' },
                { title: 'Flags', name: 'flags' },
            ],
            returnStateField: true,
        });
    }
}
