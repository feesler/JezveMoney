import { __ } from '../../../../utils/utils.js';
import { DARK_THEME } from '../../../../Application/Application.js';
import { App } from '../../../../Application/App.js';

import { SwitchField } from '../SwitchField/SwitchField.js';

/** Dark theme toggle switch field component */
export class ThemeSwitchField extends SwitchField {
    constructor(props = {}) {
        super({
            ...props,
            checked: App.getCurrentTheme() === DARK_THEME,
            label: __('settings.darkTheme'),
            onChange: (checked) => App.setTheme(checked),
        });
    }
}
