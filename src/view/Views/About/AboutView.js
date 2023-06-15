import 'jezvejs/style';
import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import { LocaleSelectField } from '../../Components/LocaleSelectField/LocaleSelectField.js';
import { ThemeSwitchField } from '../../Components/ThemeSwitchField/ThemeSwitchField.js';

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

        this.localeField = LocaleSelectField.create();
        this.themeField = ThemeSwitchField.create();
        this.header.userNavContent.append(this.localeField.elem, this.themeField.elem);
    }
}

window.app = new Application(window.appProps);
window.app.createView(AboutView);
