import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class ImportConditionForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/importcond/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Parent rule id', name: 'rule_id' },
                { title: 'Field type (1-8)', name: 'field_id' },
                { title: 'Operator (1-5)', name: 'operator' },
                { title: 'Value', name: 'value' },
                { title: 'Flags', name: 'flags' },
            ],
            returnStateField: true,
        });
    }
}
