import 'jezvejs/style';
import { Application } from '../../../../view/js/Application.js';
import { AdminView } from '../../js/AdminView.js';
import '../../../../view/css/app.scss';
import '../../css/admin.scss';
import './style.scss';

/**
 * Admin main view
 */
class AdminTestsView extends AdminView {
}

window.app = new Application(window.appProps);
window.app.createView(AdminTestsView);
