import { View } from '../../../view/utils/View.js';
import { Header } from '../../../view/Components/Header/Header.js';

/**
 * Base Admin view
 */
export class AdminView extends View {
    /**
     * Document ready event handler
     */
    onReady() {
        const headerElem = document.querySelector('.header');
        this.header = (headerElem) ? Header.fromElement(headerElem) : null;

        this.onStart();
    }
}
