import 'jezvejs/style';

import { App } from '../../../../view/Application/App.js';
import '../../../../view/Application/Application.scss';
import { AdminView } from '../../utils/AdminView/AdminView.js';
import '../../utils/AdminView/AdminView.scss';
import { apiPost } from '../../../../view/API/index.js';
import { SwitchField } from '../../../../view/Components/Fields/SwitchField/SwitchField.js';

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
            'enableLogsField',
        ]);

        this.enableLogsField = SwitchField.fromElement(this.enableLogsField, {
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

App.createView(AdminMainView);
