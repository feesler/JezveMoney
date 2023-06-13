import 'jezvejs/style';
import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import { LocaleSelect } from '../../Components/LocaleSelect/LocaleSelect.js';
import { ThemeSwitch } from '../../Components/ThemeSwitch/ThemeSwitch.js';
import { Field } from '../../Components/Field/Field.js';
import { __ } from '../../utils/utils.js';

/**
 * About view
 */
class AboutView extends View {
    /**
     * View initialization
     */
    onStart() {
        if (window.app.isUserLoggedIn()) {
            return;
        }

        this.localeSelect = LocaleSelect.create();
        this.localeField = Field.create({
            className: 'horizontal-field',
            title: __('LANGUAGE'),
            content: this.localeSelect.elem,
        });

        this.themeSwitch = ThemeSwitch.create();
        this.themeField = Field.create({
            className: 'horizontal-field',
            title: __('DARK_THEME'),
            content: this.themeSwitch.elem,
        });

        this.header.userNavContent.append(this.localeField.elem, this.themeField.elem);
    }
}

window.app = new Application(window.appProps);
window.app.createView(AboutView);
