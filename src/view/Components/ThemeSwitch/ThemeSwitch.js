import { Switch } from 'jezvejs/Switch';
import { DARK_THEME } from '../../Application/Application.js';

/** Dark theme toggler Switch component */
export class ThemeSwitch extends Switch {
    constructor(props = {}) {
        const currentTheme = window.app.getCurrentTheme();

        super({
            ...props,
            checked: currentTheme === DARK_THEME,
            onChange: (checked) => window.app.setTheme(checked),
        });
    }
}
