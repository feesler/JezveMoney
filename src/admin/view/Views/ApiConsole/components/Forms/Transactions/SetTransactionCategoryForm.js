import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    onSubmit: null,
};

export class SetTransactionCategoryForm extends ApiRequestForm {
    static userProps = {
        elem: ['id'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
            title: 'Set category of transaction',
            action: `${App.baseURL}api/transaction/setCategory`,
            method: 'post',
            inputFields: [
                { title: 'Id', name: 'id' },
                { title: 'Category id', name: 'category_id' },
            ],
            returnStateField: true,
        });
    }
}
