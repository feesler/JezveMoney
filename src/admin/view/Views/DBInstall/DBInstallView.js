import 'jezvejs/style';
import { Application } from '../../../../view/js/Application.js';
import '../../../../view/css/app.scss';
import { AdminView } from '../../js/AdminView.js';
import '../../css/admin.scss';

export class DBInstallView extends AdminView {
}

window.app = new Application(window.appProps);
window.app.createView(DBInstallView);
