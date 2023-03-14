import 'jezvejs/style';
import { ge, createElement } from 'jezvejs';
import { Application } from '../../../../view/js/Application.js';
import '../../../../view/css/app.scss';
import { AdminListView } from '../../js/AdminListView.js';
import '../../css/admin.scss';

/**
 * Admin currecny list view
 */
class AdminCurrencyListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'currency';
        this.statePath = 'currency';
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

        return createElement('tr', {
            children: [
                createElement('td', { props: { textContent: item.id } }),
                createElement('td', { props: { textContent: item.name } }),
                createElement('td', { props: { textContent: item.sign } }),
                createElement('td', { props: { textContent: item.flags } }),
            ],
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminCurrencyListView);
