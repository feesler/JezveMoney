import { View } from '../../../view/js/View.js';

/**
 * Base Admin view
 */
export class AdminView extends View {
    /**
     * Document ready event handler
     */
    onReady() {
        this.onStart();
    }
}
