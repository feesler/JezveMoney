import { getClassNames } from '@jezvejs/dom';
import { InputField } from '../InputField/InputField.js';
import './ColorField.scss';

/* CSS classes */
const FIELD_CLASS = 'horizontal-field color-field';
const COLOR_PROP = '--color-field-value';

/**
 * Color input field component
 */
export class ColorField extends InputField {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
        });
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        if (state.value !== prevState?.value) {
            this.input.elem.style.setProperty(COLOR_PROP, state.value);
        }
    }
}
