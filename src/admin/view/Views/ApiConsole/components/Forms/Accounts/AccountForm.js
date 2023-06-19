import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class AccountForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/account/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Type', name: 'type' },
                { title: 'Name', name: 'name' },
                { title: 'Initial balance', name: 'initbalance' },
                { title: 'Limit', name: 'initlimit' },
                { title: 'Currency', name: 'curr_id' },
                { title: 'Icon', name: 'icon_id' },
                { title: 'Flags (0 - account is visible; 1 - hidden)', name: 'flags' },
            ],
            returnStateField: true,
        });
    }
}
