import { getClassNames } from 'jezvejs';
import { Switch } from 'jezvejs/Switch';

import './SwitchField.scss';

/* CSS classes */
const FIELD_CLASS = 'switch-field';

/** Dark theme toggle switch field component */
export class SwitchField extends Switch {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
        });
    }
}
