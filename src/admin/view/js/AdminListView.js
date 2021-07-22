import {
    ge,
    setParam,
    isObject,
    addChilds,
    removeChilds,
    show,
    urlJoin,
    ajax,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { createMessage } from '../../../view/js/app.js';
import { ConfirmDialog } from '../../../view/Components/ConfirmDialog/ConfirmDialog.js';
import { AdminView } from './AdminView.js';

/* global baseURL */

/**
 * Admin list view constructor
 */
export class AdminListView extends AdminView {
    constructor(...args) {
        super(...args);

        this.model = {};
        if (this.props.data) {
            this.setData(this.props.data);
        }

        this.elements = {
            itemsListElem: 'items-list',
            createBtn: 'createbtn',
            updateBtn: 'updbtn',
            deleteBtn: 'del_btn',
            itemForm: 'item-frm',
            dialogPopup: 'item_popup',
        };

        if (isObject(this.props.elements)) {
            setParam(this.elements, this.props.elements);
        }
    }

    /**
     * View initialization
     */
    onStart() {
        this.activeRow = null;

        this.itemsListElem = ge(this.elements.itemsListElem);
        this.createBtn = ge(this.elements.createBtn);
        this.updateBtn = ge(this.elements.updateBtn);
        this.deleteBtn = ge(this.elements.deleteBtn);
        this.itemForm = ge(this.elements.itemForm);
        if (!this.itemsListElem
            || !this.createBtn
            || !this.updateBtn
            || !this.deleteBtn
            || !this.itemForm) {
            throw new Error('Failed to initialize view');
        }
        this.itemsListElem.addEventListener('click', this.onRowClick.bind(this));
        this.createBtn.addEventListener('click', this.createItem.bind(this));
        this.updateBtn.addEventListener('click', this.updateItem.bind(this));
        this.deleteBtn.addEventListener('click', this.deleteItem.bind(this));

        /* popup initialization */
        this.itemForm.addEventListener('submit', this.onFormSubmit.bind(this));
        this.dialogPopup = Popup.create({
            id: this.elements.dialogPopup,
            content: this.itemForm,
            additional: 'item-form',
            btn: { closeBtn: true },
        });
    }

    /**
     * Set up new list data
     * @param {Array} data - array of items
     */
    setData(data) {
        this.model.data = data;
    }

    /**
     * Request model for item by id
     * @param {number} id - identificator of item
     */
    getItem(id) {
        if (!Array.isArray(this.model.data)) {
            return null;
        }

        return this.model.data.find((item) => item && item.id === id);
    }

    /**
     * Update fields with specified item
     * @param {Object} item - item object
     */
    setItemValues() { }

    /**
     * Process item selection
     * @param {*} id - item identificator
     */
    selectItem(id) {
        this.selectedItem = this.getItem(id);
        if (this.selectedItem) {
            this.itemForm.action = `${baseURL}api/${this.apiController}/update`;
            this.setItemValues(this.selectedItem);
        } else { /* clean */
            this.setItemValues(null);
        }

        show(this.updateBtn, (this.selectedItem != null));
        show(this.deleteBtn, (this.selectedItem != null));
    }

    /**
     * Before show create item dialog
     */
    preCreateItem() { }

    /**
     * Show create new item dialog
     */
    createItem() {
        this.preCreateItem();
        this.itemForm.action = `${baseURL}api/${this.apiController}/create`;
        this.setItemValues(null);
        this.dialogPopup.setTitle('Create');
        this.dialogPopup.show();
    }

    /**
     * Before show update item dialog
     */
    preUpdateItem() { }

    /**
     * Show update item dialog
     */
    updateItem() {
        this.preUpdateItem();
        this.dialogPopup.setTitle('Update');
        this.dialogPopup.show();
    }

    /**
     * Show delete item confirmation
     */
    deleteItem() {
        if (!this.selectedItem || !this.selectedItem.id) {
            return;
        }

        const popupContent = (this.deleteConfirmMessage)
            ? this.deleteConfirmMessage
            : 'Are you sure want to delete selected item?';

        ConfirmDialog.create({
            title: 'Delete',
            content: popupContent,
            onconfirm: () => ajax.post({
                url: `${baseURL}api/${this.apiController}/del`,
                data: JSON.stringify({ id: this.selectedItem.id }),
                headers: { 'Content-Type': 'application/json' },
                callback: this.onSubmitResult.bind(this),
            }),
        });
    }

    /**
     * Process from data if needed and return request data
     * @param {object} data - form data
     */
    prepareRequestData(data) {
        return data;
    }

    /**
     * Item form submit event handler
     * @param {Event} e - submit event object
     */
    onFormSubmit(e) {
        e.preventDefault();

        const formEl = e.target;
        let els = this.getFormData(formEl);
        els = this.prepareRequestData(els);

        if (formEl.method === 'get') {
            const params = urlJoin(els);
            let link = formEl.action;
            if (params !== '') {
                link += ((link.indexOf('?') !== -1) ? '&' : '?') + params;
            }
            ajax.get({
                url: link,
                callback: this.onSubmitResult.bind(this),
            });
        } else if (formEl.method === 'post') {
            ajax.post({
                url: formEl.action,
                data: JSON.stringify(els),
                headers: { 'Content-Type': 'application/json' },
                callback: this.onSubmitResult.bind(this),
            });
        }
    }

    /**
     * Show delete item confirmation
     */
    onSubmitResult(response) {
        let failMessage = 'Fail to submit request';
        let res;

        try {
            const respObj = JSON.parse(response);
            res = (respObj && respObj.result === 'ok');
            if (!res && respObj && respObj.msg) {
                failMessage = respObj.msg;
            }
        } catch (e) {
            res = false;
        }

        if (!res) {
            createMessage(failMessage, 'msg_error');
            return;
        }

        this.requestList();
    }

    /**
     * Request list of items from API
     */
    requestList() {
        show(this.itemsListElem, false);
        ajax.get({
            url: `${baseURL}api/${this.apiController}/list`,
            callback: this.onListResult.bind(this),
        });
    }

    /**
     * List of items response handler
     * @param {string} response - API response string
     */
    onListResult(response) {
        let respObj;
        let res;

        try {
            respObj = JSON.parse(response);
            res = (respObj && respObj.result === 'ok');
        } catch (e) {
            res = false;
        }

        if (!res) {
            return;
        }

        this.setData(respObj.data);
        removeChilds(this.itemsListElem);
        const rows = respObj.data.map((item) => {
            const row = this.renderItem(item);
            row.dataset.id = item.id;
            return row;
        });

        addChilds(this.itemsListElem, rows);
        this.selectItem(null);
        show(this.itemsListElem, true);
        this.dialogPopup.close();
    }

    /**
     * Table row click event handler
     * @param {Event} e - click event object
     */
    onRowClick(e) {
        if (!e || !e.target) {
            return;
        }

        const rowElem = e.target.closest('tr');
        if (!rowElem || !rowElem.dataset) {
            return;
        }

        if (this.activeRow) {
            this.activeRow.classList.remove('act');
        }

        rowElem.classList.add('act');
        this.activeRow = rowElem;
        const id = parseInt(rowElem.dataset.id, 10);
        this.selectItem(id);
    }
}
