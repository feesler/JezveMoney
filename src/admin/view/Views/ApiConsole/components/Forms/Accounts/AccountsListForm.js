import { createElement } from 'jezvejs';
import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    title: 'List accounts',
    onSubmit: null,
};

export class AccountsListForm extends ApiRequestForm {
    static userProps = {
        elem: ['id'],
    };

    constructor(props) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        const fields = [
            { title: 'Owner', name: 'owner' },
            { title: 'Visibility (all, visible, hidden)', name: 'visibility' },
            { title: 'Sort by (visibility)', name: 'sort' },
        ];

        this.form = createElement('form', {
            props: {
                action: `${App.baseURL}api/account/list`,
                method: 'get',
            },
            events: { submit: (e) => this.props?.onSubmit?.(e) },
            children: [
                ...this.mapOptionalFields(fields),
                this.createFormControls(),
            ],
        });

        this.elem = this.createFormContainer([
            this.createFormTitle(),
            this.form,
        ]);
    }
}
