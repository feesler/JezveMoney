import 'jezvejs/style';
import { App } from '../../../../view/Application/App.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import '../../utils/AdminView/AdminView.scss';
import './QueriesView.scss';

export class QueriesView extends AdminView {
}

App.createView(QueriesView);
