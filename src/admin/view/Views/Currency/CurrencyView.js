import 'jezvejs/style';
import { ge, ce } from 'jezvejs';
import { AdminListView } from '../../js/AdminListView.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';

/**
 * Admin currecny list view
 */
class AdminCurrencyListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'currency';
        this.deleteConfirmMessage = 'Are you sure want to delete selected currency?';
    }

    /**
     * View initialization
     */
    onStart() {
        super.onStart();

        this.idInput = ge('curr_id');
        this.nameInput = ge('curr_name');
        this.signInput = ge('curr_sign');
        this.beforeCheck = ge('isbefore');
        this.afterCheck = ge('isafter');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.nameInput.value = item.name;
            this.signInput.value = item.sign;
            this.beforeCheck.checked = (item.flags === 1);
            this.afterCheck.checked = (item.flags === 0);
        } else { /* clean */
            this.idInput.value = '';
            this.nameInput.value = '';
            this.signInput.value = '';
            this.beforeCheck.checked = false;
            this.afterCheck.checked = true;
        }
    }

    /**
     * Render list element for specified item
     * @param {object} item - item object
     */
    renderItem(item) {
        if (!item) {
            return null;
        }

        return ce('tr', {}, [
            ce('td', { textContent: item.id }),
            ce('td', { textContent: item.name }),
            ce('td', { textContent: item.sign }),
            ce('td', { textContent: item.flags }),
        ]);
    }
}

window.view = new AdminCurrencyListView(window.app);
