import { createElement } from 'jezvejs';
import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    title: 'List persons',
    onSubmit: null,
};

export class PersonsListForm extends ApiRequestForm {
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
        const title = 'List persons';
        this.titleElem = createElement('h3', { props: { textContent: title } });

        const fields = [
            { title: 'Visibility (all, visible, hidden)', name: 'visibility' },
        ];

        this.form = createElement('form', {
            props: {
                action: `${App.baseURL}api/person/list`,
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
