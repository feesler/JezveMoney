import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class CategoryForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/category/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Name', name: 'name' },
                { title: 'Color', name: 'color' },
                { title: 'Parent category (0 for no parent)', name: 'parent_id' },
                { title: 'Transaction type (0 for any)', name: 'type' },
            ],
            returnStateField: true,
        });
    }
}
