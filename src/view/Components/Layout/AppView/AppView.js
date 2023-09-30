import { View } from 'jezvejs/View';

import { App } from '../../../Application/App.js';
import { __ } from '../../../utils/utils.js';

import { AppHeader } from '../AppHeader/AppHeader.js';

/**
 * Base View class
 */
export class AppView extends View {
    /**
     * View pre initialization handler
     */
    preStart() {
        App.setupLocale();
        App.setupTheme();
        App.updateTimeZone();

        this.initHeader();
    }

    /**
     * View post initialization handler
     */
    postStart() {
        const { message } = App;
        if (message) {
            App.createNotification(message.title, message.type);
        }
    }

    initHeader() {
        const pageWrapper = document.querySelector('.page_wrapper');
        if (!pageWrapper) {
            return;
        }

        this.header = AppHeader.create({
            title: __('appName'),
        });

        pageWrapper.prepend(this.header.elem);

        App.updateRemindersBadge();
    }
}
