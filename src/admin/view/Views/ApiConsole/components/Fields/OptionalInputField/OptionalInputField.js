import { getClassName } from 'jezvejs';
import { Checkbox } from 'jezvejs/Checkbox';
import { InputField } from '../../../../../../../view/Components/Form/Fields/InputField/InputField.js';

import './OptionalInputField.scss';

const FIELD_CLASS = 'optional-field';

const defaultProps = {
    disabled: true,
};

export class OptionalInputField extends InputField {
    constructor(props) {
        super({
            ...defaultProps,
            ...props,
            className: getClassName(FIELD_CLASS, props.className),
            title: Checkbox.create({
                label: props.title,
                onChange: (checked) => this.enableContent(checked),
            }).elem,
        });

        this.enableContent(!this.props.disabled);
    }

    enableContent(value) {
        this.input.enable(value);
        this.input.show(value);
    }
}
