import { asArray, createElement } from 'jezvejs';

import { InputField } from '../../../../../../../../view/Components/Form/Fields/InputField/InputField.js';
import { ReturnStateField } from '../../../Fields/ReturnStateField/ReturnStateField.js';
import { ApiRequestForm } from '../ApiRequestForm/ApiRequestForm.js';

const defaultProps = {
    id: undefined,
    title: 'Read items by ids',
    additionalFields: null,
    returnStateField: false,
    method: 'get',
    action: '',
    onSubmit: null,
};

export class ItemIdsForm extends ApiRequestForm {
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
                // Item ids field
                InputField.create({
                    title: 'Ids',
                    name: 'id',
                    className: 'form-row',
                }).elem,
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
