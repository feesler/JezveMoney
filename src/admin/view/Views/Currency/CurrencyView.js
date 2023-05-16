import 'jezvejs/style';
import { ge, createElement, hasFlag } from 'jezvejs';
import { Application } from '../../../../view/Application/Application.js';
import { CURRENCY_SIGN_BEFORE_VALUE, CURRENCY_FORMAT_TRAILING_ZEROS } from '../../../../view/Models/Currency.js';
import { AdminListView } from '../../utils/AdminListView/AdminListView.js';
import '../../../../view/Components/Field/Field.scss';
import '../../../../view/Application/Application.scss';
import '../../utils/AdminView/AdminView.scss';

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
        this.codeInput = ge('curr_code');
        this.signInput = ge('curr_sign');
        this.precisionInput = ge('curr_precision');
        this.beforeCheck = ge('isbefore');
        this.afterCheck = ge('isafter');
        this.trailingZerosCheck = ge('trailingZerosCheck');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.nameInput.value = item.name;
            this.codeInput.value = item.code;
            this.signInput.value = item.sign;
            this.precisionInput.value = item.precision;
            this.beforeCheck.checked = hasFlag(item.flags, CURRENCY_SIGN_BEFORE_VALUE);
            this.afterCheck.checked = !hasFlag(item.flags, CURRENCY_SIGN_BEFORE_VALUE);
            this.trailingZerosCheck.checked = hasFlag(item.flags, CURRENCY_FORMAT_TRAILING_ZEROS);
        } else { /* clean */
            this.idInput.value = '';
            this.nameInput.value = '';
            this.codeInput.value = '';
            this.signInput.value = '';
            this.precisionInput.value = '';
            this.beforeCheck.checked = false;
            this.afterCheck.checked = true;
            this.trailingZerosCheck.checked = false;
        }
    }

    /* eslint-disable no-bitwise */
    /**
     * Process from data if needed and return request data
     * @param {object} data - form data
     */
    prepareRequestData(data) {
        return super.prepareRequestData({
            ...data,
            flags: (this.trailingZerosCheck.checked)
                ? (data.flags | CURRENCY_FORMAT_TRAILING_ZEROS)
                : data.flags,
        });
    }
    /* eslint-enable no-bitwise */

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
                createElement('td', { props: { textContent: item.code } }),
                createElement('td', { props: { textContent: item.sign } }),
                createElement('td', { props: { textContent: item.precision } }),
                createElement('td', { props: { textContent: item.flags } }),
            ],
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(AdminCurrencyListView);
