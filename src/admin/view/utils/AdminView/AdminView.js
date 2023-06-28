import { AppView } from '../../../../view/Components/AppView/AppView.js';
import { Header } from '../../../../view/Components/Header/Header.js';

/**
 * Base Admin view
 */
export class AdminView extends AppView {
    /**
     * Document ready event handler
     */
    onReady() {
        const headerElem = document.querySelector('.header');
        this.header = (headerElem) ? Header.fromElement(headerElem) : null;

        this.onStart();
    }
}
