import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    isUpdate: false,
};

export class IconForm extends ApiRequestForm {
    constructor(props = {}) {
        const { isUpdate = false } = props;
        const apiMethod = (isUpdate) ? 'update' : 'create';

        super({
            ...defaultProps,
            ...props,
            action: `${App.baseURL}api/icon/${apiMethod}`,
            method: 'post',
            inputFields: [
                ...((isUpdate) ? [{ title: 'Id', name: 'id' }] : []),
                { title: 'Name', name: 'name' },
                { title: 'File name', name: 'file' },
                { title: 'Type (0 - No type, 1 - Tile icon)', name: 'type' },
            ],
            returnStateField: true,
        });
    }
}
