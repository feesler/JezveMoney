import { createElement, Component, asArray } from 'jezvejs';

import { InputField } from '../../../../../../../../view/Components/Form/Fields/InputField/InputField.js';
import { FormControls } from '../../../../../../../../view/Components/Form/FormControls/FormControls.js';
import { OptionalInputField } from '../../../Fields/OptionalInputField/OptionalInputField.js';
import { ReturnStateField } from '../../../Fields/ReturnStateField/ReturnStateField.js';

/* CSS classes */
const CONTAINER_CLASS = 'request-data-form';
const FIELD_CLASS = 'form-row';

const defaultProps = {
    id: undefined,
    inputFields: null,
    optionalFields: null,
    additionalFields: null,
    returnStateField: false,
    method: 'get',
    action: '',
    onSubmit: null,
};

export class ApiRequestForm extends Component {
    static userProps = {
        elem: ['id'],
    };

    constructor(props) {
        super({
            ...defaultProps,
            ...props,
        });

        this.init();
        this.postInit();
    }

    createFormTitle(title = this.props.title) {
        return createElement('h2', { props: { textContent: title } });
    }

    createFormControls() {
        return FormControls.create({
            cancelBtn: null,
        }).elem;
    }

    mapInputFields(fields) {
        return asArray(fields).map((item) => (
            InputField.create({
                ...item,
                className: FIELD_CLASS,
            }).elem
        ));
    }

    mapOptionalFields(fields) {
        return asArray(fields).map((item) => (
            OptionalInputField.create({
                ...item,
                className: FIELD_CLASS,
            }).elem
        ));
    }

    createFormContainer(children) {
        return createElement('div', {
            props: { className: CONTAINER_CLASS },
            children,
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
                ...this.mapInputFields(this.props.inputFields),
                ...this.mapOptionalFields(this.props.optionalFields),
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

    postInit() {
        this.setClassNames();
        this.setUserProps();
    }
}
