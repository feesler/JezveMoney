import 'jezvejs/style';
import { Switch } from 'jezvejs/Switch';
import { Application } from '../../../../view/Application/Application.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import '../../utils/AdminView/AdminView.scss';
import { apiPost } from '../../../../view/API/index.js';

/**
 * Admin main view
 */
class AdminMainView extends AdminView {
    /**
     * View initialization
     */
    onStart(...args) {
        super.onStart(...args);

        this.loadElementsByIds([
            'enableLogsSwitch',
        ]);

        this.enableLogsSwitch = Switch.fromElement(this.enableLogsSwitch, {
            onChange: (checked) => this.toggleEnableLogs(checked),
        });
    }

    toggleEnableLogs(value) {
        apiPost('systemsettings/update', {
            name: 'enableLogs',
            value,
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminMainView);
