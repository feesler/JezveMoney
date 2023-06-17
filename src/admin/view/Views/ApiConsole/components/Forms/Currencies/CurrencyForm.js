import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class CurrencyForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/currency/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Name', name: 'name' },
                { title: 'Code', name: 'code' },
                { title: 'Sign', name: 'sign' },
                { title: 'Precision', name: 'precision' },
                { title: 'Flags (0 - sign on right, 1 - sign on left)', name: 'flags' },
            ],
            returnStateField: true,
        });
    }
}
