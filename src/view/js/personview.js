'use strict';

/* global ge, copyObject, extend, View, ConfirmDialog, IconLink */

var singlePersonDeleteTitle = 'Delete person';
var singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';

/**
 * Create/update person view
 */
function PersonView() {
    PersonView.parent.constructor.apply(this, arguments);

    this.model = {};

    if (this.props.person) {
        this.model.original = this.props.person;
        this.model.data = copyObject(this.model.original);
    }
}

extend(PersonView, View);

/**
 * View initialization
 */
PersonView.prototype.onStart = function () {
    this.form = ge('personForm');
    if (!this.form) {
        throw new Error('Failed to initialize Person view');
    }
    this.form.addEventListener('submit', this.onSubmit.bind(this));

    this.nameInp = ge('pname');
    if (!this.nameInp) {
        throw new Error('Failed to initialize Person view');
    }

    this.nameInp.addEventListener('input', this.onNameInput.bind(this));

    // Update mode
    if (this.model.original.id) {
        this.deleteBtn = IconLink.fromElement({
            elem: 'del_btn',
            onclick: this.confirmDelete.bind(this)
        });
        this.delForm = ge('delform');
        if (!this.delForm) {
            throw new Error('Failed to initialize Person view');
        }
    }
};

/**
 * Person name input event handler
 */
PersonView.prototype.onNameInput = function () {
    this.clearBlockValidation('name-inp-block');
};

/**
 * Form submit event handler
 */
PersonView.prototype.onSubmit = function (e) {
    var valid = true;

    if (!this.nameInp.value || this.nameInp.value.length < 1) {
        this.invalidateBlock('name-inp-block');
        this.nameInp.focus();
        valid = false;
    }

    if (!valid) {
        e.preventDefault();
    }
};

/**
 * Show person delete confirmation popup
 */
PersonView.prototype.confirmDelete = function () {
    if (!this.model.data.id) {
        return;
    }

    ConfirmDialog.create({
        id: 'delete_warning',
        title: singlePersonDeleteTitle,
        content: singlePersonDeleteMsg,
        onconfirm: this.delForm.submit.bind(this.delForm)
    });
};
