import 'jezvejs/style';
import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';

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
