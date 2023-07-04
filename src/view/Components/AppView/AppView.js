import { View } from 'jezvejs/View';

import { App } from '../../Application/App.js';
import { Header } from '../Header/Header.js';

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

        const headerElem = document.querySelector('.header');
        this.header = (headerElem) ? Header.fromElement(headerElem) : null;

        App.updateRemindersBadge();
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
}
