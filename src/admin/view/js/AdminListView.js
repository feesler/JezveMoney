import {
    ge,
    setProps,
    isObject,
    addChilds,
    removeChilds,
    show,
    setEvents,
} from 'jezvejs';
import { Popup } from 'jezvejs/Popup';
import { ConfirmDialog } from '../../../view/Components/ConfirmDialog/ConfirmDialog.js';
import { AdminView } from './AdminView.js';

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
            setProps(this.elements, this.props.elements);
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
        setEvents(this.itemsListElem, { click: (e) => this.onRowClick(e) });
        setEvents(this.createBtn, { click: (e) => this.createItem(e) });
        setEvents(this.updateBtn, { click: (e) => this.updateItem(e) });
        setEvents(this.deleteBtn, { click: (e) => this.deleteItem(e) });

        /* popup initialization */
        setEvents(this.itemForm, { submit: (e) => this.onFormSubmit(e) });
        this.dialogPopup = Popup.create({
            id: this.elements.dialogPopup,
            content: this.itemForm,
            className: 'item-form',
            closeButton: true,
        });
        show(this.itemForm, true);
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
        const { baseURL } = window.app;

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
        const { baseURL } = window.app;

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
            onConfirm: async () => {
                const reqURL = `${window.app.baseURL}api/${this.apiController}/del`;
                const data = this.prepareRequestData({ id: this.selectedItem.id });

                const response = await fetch(reqURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                const apiResult = await response.json();
                this.onSubmitResult(apiResult);
            },
        });
    }

    /**
     * Process from data if needed and return request data
     * @param {object} data - form data
     */
    prepareRequestData(data) {
        return (this.statePath)
            ? {
                ...data,
                returnState: {
                    [this.statePath]: {},
                },
            }
            : data;
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

        this.requestSubmit(formEl.method, formEl.action, els);
    }

    async requestSubmit(method, action, data) {
        const options = { method };
        const url = new URL(action);

        if (method === 'post') {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(data);
        } else {
            Object.entries(data).forEach(([name, value]) => url.searchParams.set(name, value));
        }

        const response = await fetch(url, options);
        const apiResult = await response.json();
        this.onSubmitResult(apiResult);
    }

    /**
     * Show delete item confirmation
     */
    onSubmitResult(apiResult) {
        let failMessage = 'Fail to submit request';

        const res = (apiResult && apiResult.result === 'ok');
        if (!res && apiResult?.msg) {
            failMessage = apiResult.msg;
        }

        if (!res) {
            window.app.createErrorNotification(failMessage);
            return;
        }

        const stateResult = apiResult.data?.state?.[this.statePath];
        if (stateResult) {
            this.setListData(apiResult.data.state[this.statePath].data);
            this.dialogPopup.close();
        } else {
            this.requestList();
        }
    }

    /**
     * Request list of items from API
     */
    async requestList() {
        const { baseURL } = window.app;

        show(this.itemsListElem, false);

        const response = await fetch(`${baseURL}api/${this.apiController}/list`);
        const apiResult = await response.json();
        this.onListResult(apiResult);
    }

    /**
     * List of items response handler
     * @param {string} response - API response string
     */
    onListResult(apiResult) {
        if (!apiResult || apiResult.result !== 'ok') {
            return;
        }

        this.setListData(apiResult.data);

        this.dialogPopup.close();
    }

    setListData(data) {
        this.setData(data);
        removeChilds(this.itemsListElem);
        const rows = data.map((item) => {
            const row = this.renderItem(item);
            row.dataset.id = item.id;
            return row;
        });

        addChilds(this.itemsListElem, rows);
        this.selectItem(null);
        show(this.itemsListElem, true);
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
