import { createElement } from 'jezvejs';
import { App } from '../../../../../../../view/Application/App.js';
import { ApiRequestForm } from '../Common/ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    title: 'List categories',
    onSubmit: null,
};

export class CategoriesListForm extends ApiRequestForm {
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
            { title: 'Parent category', name: 'parent_id' },
        ];

        this.form = createElement('form', {
            props: {
                action: `${App.baseURL}api/category/list`,
                method: 'get',
            },
            events: { submit: (e) => this.props.onSubmit?.(e) },
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
