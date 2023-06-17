import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class ImportTemplateForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/importtpl/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Name', name: 'name' },
                { title: 'Type', name: 'type_id' },
                { title: 'Default account (0 for disabled)', name: 'account_id' },
                { title: 'First row (1-based)', name: 'first_row' },
                { title: 'Date locale', name: 'date_locale' },
                { title: 'Account amount column', name: 'account_amount_col' },
                { title: 'Account currency column', name: 'account_curr_col' },
                { title: 'Transaction amount column', name: 'trans_amount_col' },
                { title: 'Transaction currency column', name: 'trans_curr_col' },
                { title: 'Date column', name: 'date_col' },
                { title: 'Comment column', name: 'comment_col' },
            ],
            returnStateField: true,
        });
    }
}
