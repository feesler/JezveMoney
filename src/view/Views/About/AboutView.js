import 'jezvejs/style';
import { View } from '../../js/View.js';
import '../../css/app.css';

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

window.view = new AboutView(window.app);
