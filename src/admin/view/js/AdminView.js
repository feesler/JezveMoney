import { View } from '../../../view/js/View.js';
import { Header } from '../../../view/Components/Header/Header.js';

/**
 * Base Admin view
 */
export class AdminView extends View {
    /**
     * Document ready event handler
     */
    onReady() {
        this.header = Header.create();
        this.onStart();
    }
}
