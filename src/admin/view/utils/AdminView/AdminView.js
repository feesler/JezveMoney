import { App } from '../../../../view/Application/App.js';
import { AppView } from '../../../../view/Components/Layout/AppView/AppView.js';
import { AdminHeader } from '../../Components/AdminHeader/AdminHeader.js';

/**
 * Base Admin view
 */
export class AdminView extends AppView {
    initHeader() {
        const pageWrapper = document.querySelector('.page_wrapper');
        if (!pageWrapper) {
            return;
        }

        this.header = AdminHeader.create();

        pageWrapper.prepend(this.header.elem);

        App.updateRemindersBadge();
    }
}
