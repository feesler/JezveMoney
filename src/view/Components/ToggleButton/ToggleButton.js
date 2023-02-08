import { getClassNames } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import './style.scss';

/* CSS classes */
const TOGGLE_BUTTON_CLASS = 'toggle-btn';

export class ToggleButton extends Button {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassNames(TOGGLE_BUTTON_CLASS, props.className),
            icon: 'toggle-ext',
        });
    }
}
