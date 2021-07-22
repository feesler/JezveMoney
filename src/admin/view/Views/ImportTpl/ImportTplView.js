import 'jezvejs/style';
import { ge, ce } from 'jezvejs';
import { AdminListView } from '../../js/AdminListView.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';

/**
 * Admin import template list view
 */
class AdminImportTemplateListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'importtpl';
        this.deleteConfirmMessage = 'Are you sure want to delete selected template?';
    }

    /**
     * View initialization
     */
    onStart() {
        super.onStart();

        this.idInput = ge('item_id');
        this.nameInput = ge('item_name');
        this.typeInput = ge('item_type_id');
        this.dateColInput = ge('item_date_col');
        this.commentColInput = ge('item_comment_col');
        this.trCurrColInput = ge('item_trans_curr_col');
        this.trAmountColInput = ge('item_trans_amount_col');
        this.accCurrColInput = ge('item_account_curr_col');
        this.accAmountColInput = ge('item_account_amount_col');
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.nameInput.value = item.name;
            this.typeInput.value = item.type_id;
            this.dateColInput.value = item.columns.date;
            this.commentColInput.value = item.columns.comment;
            this.trCurrColInput.value = item.columns.transactionCurrency;
            this.trAmountColInput.value = item.columns.transactionAmount;
            this.accCurrColInput.value = item.columns.accountCurrency;
            this.accAmountColInput.value = item.columns.accountAmount;
        } else {
            this.idInput.value = '';
            this.nameInput.value = '';
            this.typeInput.value = '';
            this.dateColInput.value = '';
            this.commentColInput.value = '';
            this.trCurrColInput.value = '';
            this.trAmountColInput.value = '';
            this.accCurrColInput.value = '';
            this.accAmountColInput.value = '';
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
            ce('td', { textContent: item.type_id }),
            ce('td', { textContent: item.columns.date }),
            ce('td', { textContent: item.columns.comment }),
            ce('td', { textContent: item.columns.transactionCurrency }),
            ce('td', { textContent: item.columns.transactionAmount }),
            ce('td', { textContent: item.columns.accountCurrency }),
            ce('td', { textContent: item.columns.accountAmount }),
        ]);
    }
}

window.view = new AdminImportTemplateListView(window.app);
