import 'jezvejs/style';
import { Application } from '../../../../view/Application/Application.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../js/AdminView.js';
import '../../css/admin.scss';
import './TestsView.scss';

/**
 * Admin main view
 */
class AdminTestsView extends AdminView {
}

window.app = new Application(window.appProps);
window.app.createView(AdminTestsView);
