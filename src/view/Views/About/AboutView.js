import 'jezvejs/style';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';

import { LocaleSelectField } from '../../Components/Fields/LocaleSelectField/LocaleSelectField.js';
import { ThemeSwitchField } from '../../Components/Fields/ThemeSwitchField/ThemeSwitchField.js';

/**
 * About view
 */
class AboutView extends View {
    /**
     * View initialization
     */
    onStart() {
        if (App.isUserLoggedIn()) {
            return;
        }

        this.localeField = LocaleSelectField.create();
        this.themeField = ThemeSwitchField.create();
        this.header.userNavContent.append(this.localeField.elem, this.themeField.elem);
    }
}

App.createView(AboutView);
