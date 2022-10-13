import 'jezvejs/style';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';

/**
 * About view
 */
class AboutView extends View {
    /**
     * View initialization
     */
    onStart() {
    }
}

window.app = new Application(window.appProps);
window.app.createView(AboutView);
