import 'jezvejs/style';
import { Application } from '../../../../view/Application/Application.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import '../../utils/AdminView/AdminView.scss';

export class AdminLogsView extends AdminView {
}

window.app = new Application(window.appProps);
window.app.createView(AdminLogsView);
