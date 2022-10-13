import 'jezvejs/style';
import { Application } from '../../../../view/js/Application.js';
import '../../../../view/css/app.scss';
import { AdminView } from '../../js/AdminView.js';
import '../../css/admin.scss';
import './style.scss';

export class QueriesView extends AdminView {
}

window.app = new Application(window.appProps);
window.app.createView(QueriesView);
