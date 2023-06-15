import { getClassNames } from 'jezvejs';
import { Switch } from 'jezvejs/Switch';

import { DARK_THEME } from '../../Application/Application.js';
import { __ } from '../../utils/utils.js';
import { Field } from '../Field/Field.js';

/* CSS classes */
const FIELD_CLASS = 'horizontal-field';

/** Dark theme toggle switch field component */
export class ThemeSwitchField extends Field {
    constructor(props = {}) {
        const currentTheme = window.app.getCurrentTheme();

        const themeSwitch = Switch.create({
            checked: currentTheme === DARK_THEME,
            onChange: (checked) => window.app.setTheme(checked),
        });

        super({
            ...props,
            className: getClassNames(FIELD_CLASS, props.className),
            title: __('DARK_THEME'),
            content: themeSwitch.elem,
        });
    }
}
