import { getClassNames } from 'jezvejs';
import { IconButton } from 'jezvejs/IconButton';
import './style.scss';

/* CSS classes */
const TOGGLE_BUTTON_CLASS = 'toggle-btn';

export class ToggleButton extends IconButton {
    constructor(props = {}) {
        super({
            ...props,
            className: getClassNames(TOGGLE_BUTTON_CLASS, props.className),
            icon: 'toggle-ext',
        });
    }
}
