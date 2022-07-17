import 'jezvejs/style';
import { Application } from '../../../../view/js/Application.js';
import { AdminView } from '../../js/AdminView.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';

/**
 * Admin main view
 */
class AdminMainView extends AdminView {
}

window.app = new Application(window.appProps);
window.app.createView(AdminMainView);
