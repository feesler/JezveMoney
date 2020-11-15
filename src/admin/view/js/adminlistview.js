'use strict';

/* global setParam, isObject, ge, addChilds, removeChilds, show, urlJoin, extend, ajax */
/* global createMessage, AdminView, Popup, ConfirmDialog, baseURL */

/**
 * Admin list view constructor
 */
function AdminListView() {
    AdminListView.parent.constructor.apply(this, arguments);

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
        dialogPopup: 'item_popup'
    };

    if (isObject(this.props.elements)) {
        setParam(this.elements, this.props.elements);
    }
}

extend(AdminListView, AdminView);

/**
 * View initialization
 */
AdminListView.prototype.onStart = function () {
    this.activeRow = null;

    this.itemsListElem = ge(this.elements.itemsListElem);
    this.createBtn = ge(this.elements.createBtn);
    this.updateBtn = ge(this.elements.updateBtn);
    this.deleteBtn = ge(this.elements.deleteBtn);
    this.itemForm = ge(this.elements.itemForm);
    if (
        !this.itemsListElem
        || !this.createBtn
        || !this.updateBtn
        || !this.deleteBtn
        || !this.itemForm
    ) {
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
        additional: 'center_only item-form',
        btn: { closeBtn: true }
    });
};

/**
 * Set up new list data
 * @param {Array} data - array of items
 */
AdminListView.prototype.setData = function (data) {
    this.model.data = data;
};

/**
 * Request model for item by id
 * @param {number} id - identificator of item
 */
AdminListView.prototype.getItem = function (id) {
    if (!Array.isArray(this.model.data)) {
        return null;
    }

    return this.model.data.find(function (item) {
        return item && item.id === id;
    });
};

/**
 * Update fields with specified item
 * @param {Object} item - item object
 */
AdminListView.prototype.setItemValues = function () { };

/**
 * Process item selection
 * @param {*} id - item identificator
 */
AdminListView.prototype.selectItem = function (id) {
    this.selectedItem = this.getItem(id);
    if (this.selectedItem) {
        this.itemForm.action = baseURL + 'api/' + this.apiController + '/update';
        this.setItemValues(this.selectedItem);
    } else { /* clean */
        this.setItemValues(null);
    }

    show(this.updateBtn, (this.selectedItem != null));
    show(this.deleteBtn, (this.selectedItem != null));
};

/**
 * Before show create item dialog
 */
AdminListView.prototype.preCreateItem = function () { };

/**
 * Show create new item dialog
 */
AdminListView.prototype.createItem = function () {
    this.preCreateItem();
    this.itemForm.action = baseURL + 'api/' + this.apiController + '/create';
    this.setItemValues(null);
    this.dialogPopup.show();
};

/**
 * Before show update item dialog
 */
AdminListView.prototype.preUpdateItem = function () { };

/**
 * Show update item dialog
 */
AdminListView.prototype.updateItem = function () {
    this.preUpdateItem();
    this.dialogPopup.show();
};

/**
 * Show delete item confirmation
 */
AdminListView.prototype.deleteItem = function () {
    var popupContent;

    if (!this.selectedItem || !this.selectedItem.id) {
        return;
    }

    popupContent = (this.deleteConfirmMessage)
        ? this.deleteConfirmMessage
        : 'Are you sure want to delete selected item?';

    ConfirmDialog.create({
        title: 'Delete',
        content: popupContent,
        additional: 'center_only',
        onconfirm: function () {
            ajax.post({
                url: baseURL + 'api/' + this.apiController + '/del',
                data: JSON.stringify({ id: this.selectedItem.id }),
                headers: { 'Content-Type': 'application/json' },
                callback: this.onSubmitResult.bind(this)
            });
        }.bind(this)
    });
};

/**
 * Process from data if needed and return request data
 * @param {object} data - form data
 */
AdminListView.prototype.prepareRequestData = function (data) {
    return data;
};

/**
 * Item form submit event handler
 * @param {Event} e - submit event object
 */
AdminListView.prototype.onFormSubmit = function (e) {
    var formEl;
    var params;
    var link;
    var els;

    e.preventDefault();

    formEl = e.target;
    els = this.getFormData(formEl);
    els = this.prepareRequestData(els);

    if (formEl.method === 'get') {
        params = urlJoin(els);
        link = formEl.action;
        if (params !== '') {
            link += ((link.indexOf('?') !== -1) ? '&' : '?') + params;
        }
        ajax.get({
            url: link,
            callback: this.onSubmitResult.bind(this)
        });
    } else if (formEl.method === 'post') {
        ajax.post({
            url: formEl.action,
            data: JSON.stringify(els),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onSubmitResult.bind(this)
        });
    }
};

/**
 * Show delete item confirmation
 */
AdminListView.prototype.onSubmitResult = function (response) {
    var failMessage = 'Fail to submit request';
    var respObj;
    var res;

    try {
        respObj = JSON.parse(response);
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
};

/**
 * Request list of items from API
 */
AdminListView.prototype.requestList = function () {
    ajax.get({
        url: baseURL + 'api/' + this.apiController + '/list',
        callback: this.onListResult.bind(this)
    });
};

/**
 * List of items response handler
 * @param {string} response - API response string
 */
AdminListView.prototype.onListResult = function (response) {
    var respObj;
    var rows;
    var res;

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
    rows = respObj.data.map(function (item) {
        var row = this.renderItem(item);
        row.dataset.id = item.id;
        return row;
    }, this);

    addChilds(this.itemsListElem, rows);
    this.selectItem(null);
    this.dialogPopup.close();
};

/**
 * Table row click event handler
 * @param {Event} e - click event object
 */
AdminListView.prototype.onRowClick = function (e) {
    var id;
    var rowElem;

    if (!e || !e.target) {
        return;
    }

    rowElem = e.target.closest('tr');
    if (!rowElem || !rowElem.dataset) {
        return;
    }

    if (this.activeRow) {
        this.activeRow.classList.remove('act');
    }

    rowElem.classList.add('act');
    this.activeRow = rowElem;
    id = parseInt(rowElem.dataset.id, 10);
    this.selectItem(id);
};
