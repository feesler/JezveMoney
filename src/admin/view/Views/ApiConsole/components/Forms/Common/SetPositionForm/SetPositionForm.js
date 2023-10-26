import { createElement } from '@jezvejs/dom';
import { asArray } from '@jezvejs/types';
import { ReturnStateField } from '../../../Fields/ReturnStateField/ReturnStateField.js';
import { ApiRequestForm } from '../ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    title: 'Set item position',
    additionalFields: null,
    returnStateField: false,
    method: 'post',
    action: '',
    onSubmit: null,
};

export class SetPositionForm extends ApiRequestForm {
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
        this.form = createElement('form', {
            props: {
                method: this.props.method,
                action: this.props.action,
            },
            events: { submit: (e) => this.props?.onSubmit?.(e) },
            children: [
                ...this.mapInputFields([
                    { title: 'Id', name: 'id' },
                    { title: 'Position', name: 'pos' },
                ]),
                // Additional fields
                ...asArray(this.props.additionalFields),
                // Return state field
                (this.props.returnStateField) ? ReturnStateField.create().elem : null,
                // Form controls
                this.createFormControls(),
            ],
        });

        this.elem = this.createFormContainer([
            this.createFormTitle(),
            this.form,
        ]);
    }
}
