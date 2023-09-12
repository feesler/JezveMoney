import { AppView } from '../../../../view/Components/AppView/AppView.js';

/**
 * Base Admin view
 */
export class AdminView extends AppView {
    initHeader() {
        super.initHeader();

        this.header.setLogoTitle('Admin');
    }
}
