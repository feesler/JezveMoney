import 'jezvejs/style';
import { App } from '../../../../view/Application/App.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import '../../utils/AdminView/AdminView.scss';

export class AdminLogsView extends AdminView {
}

App.createView(AdminLogsView);
