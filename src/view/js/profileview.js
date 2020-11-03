'use strict';

/* global ge, extend, View, Popup, ConfirmDialog, baseURL, ajax, createMessage */

var resetAccMsg = 'Are you sure want to reset all your accounts?<br>All accounts and transactions will be lost.';
var resetAllMsg = 'Are you sure to reset all your data?<br>Everything will be lost.';
var deleteMsg = 'Are you sure to completely delete your profile?<br>This operation can not be undone.';

/**
 * User profile view
 */
function ProfileView() {
    ProfileView.parent.constructor.apply(this, arguments);

    this.model = {};

    if (this.props.profile) {
        this.model.data = this.props.profile;
    }
}

extend(ProfileView, View);

/**
 * View initialization
 */
ProfileView.prototype.onStart = function () {
    this.changeNamePopup = null;
    this.changePassPopup = null;

    this.nameElem = ge('namestatic');
    if (!this.nameElem) {
        throw new Error('Failed to initialize Profile view');
    }

    this.changeNameBtn = ge('changeNameBtn');
    if (!this.changeNameBtn) {
        throw new Error('Failed to initialize Profile view');
    }
    this.changeNameBtn.addEventListener('click', this.showChangeNamePopup.bind(this));

    this.changePassBtn = ge('changePassBtn');
    if (!this.changePassBtn) {
        throw new Error('Failed to initialize Profile view');
    }
    this.changePassBtn.addEventListener('click', this.showChangePasswordPopup.bind(this));

    this.resetAccBtn = ge('resetAccBtn');
    if (!this.resetAccBtn) {
        throw new Error('Failed to initialize Profile view');
    }
    this.resetAccBtn.addEventListener('click', this.confirmResetAccounts.bind(this));

    this.resetAccForm = ge('resetacc_form');
    if (!this.resetAccForm) {
        throw new Error('Failed to initialize Profile view');
    }

    this.resetAllBtn = ge('resetAllBtn');
    if (!this.resetAllBtn) {
        throw new Error('Failed to initialize Profile view');
    }
    this.resetAllBtn.addEventListener('click', this.confirmResetAll.bind(this));

    this.resetAllForm = ge('resetall_form');
    if (!this.resetAllForm) {
        throw new Error('Failed to initialize Profile view');
    }

    this.delProfileBtn = ge('delProfileBtn');
    if (!this.delProfileBtn) {
        throw new Error('Failed to initialize Profile view');
    }
    this.delProfileBtn.addEventListener('click', this.confirmDelete.bind(this));

    this.deleteForm = ge('delete_form');
    if (!this.deleteForm) {
        throw new Error('Failed to initialize Profile view');
    }

    this.changeNameContent = ge('changename');
    if (!this.changeNameContent) {
        throw new Error('Failed to initialize Profile view');
    }
    this.changeNameForm = this.changeNameContent.querySelector('form');
    if (!this.changeNameForm) {
        throw new Error('Failed to initialize Profile view');
    }
    this.changeNameForm.addEventListener('submit', this.onChangeNameSubmit.bind(this));

    this.changePassContent = ge('changepass');
    if (!this.changePassContent) {
        throw new Error('Failed to initialize Profile view');
    }
    this.changePassForm = this.changePassContent.querySelector('form');
    if (!this.changePassForm) {
        throw new Error('Failed to initialize Profile view');
    }
    this.changePassForm.addEventListener('submit', this.onChangePassSubmit.bind(this));

    if (this.props.action) {
        if (this.props.action === 'changepass') {
            this.showChangePasswordPopup();
        } else if (this.props.action === 'changename') {
            this.showChangeNamePopup();
        }
    }
};

/**
 * Old password input at change password form event handler
 */
ProfileView.prototype.onOldPasswordInput = function () {
    this.clearBlockValidation('old-pwd-inp-block');
};

/**
 * New password input at change password form event handler
 */
ProfileView.prototype.onNewPasswordInput = function () {
    this.clearBlockValidation('new-pwd-inp-block');
};

/**
 * New name input at change name form event handler
 */
ProfileView.prototype.onNewNameInput = function () {
    this.clearBlockValidation('name-inp-block');
};

// Create and show change name popup
ProfileView.prototype.showChangeNamePopup = function (e) {
    e.preventDefault();

    if (!this.changeNamePopup) {
        this.changeNamePopup = Popup.create({
            id: 'chname_popup',
            title: 'Change name',
            content: this.changeNameContent,
            additional: 'center_only chname_popup'
        });

        this.changeNamePopup.setControls({
            okBtn: { onclick: this.onChangeNameSubmit.bind(this) },
            closeBtn: true
        });

        this.newNameInp = ge('newname');
        if (!this.newNameInp) {
            throw new Error('Failed to initialize change name dialog');
        }

        this.newNameInp.addEventListener('input', this.onNewNameInput.bind(this));
    }

    this.newNameInp.value = this.model.data.name;

    this.changeNamePopup.show();
};

/**
 * Change password request callback
 * @param {string} response - text of response
 */
ProfileView.prototype.onChangePasswordResult = function (response) {
    var success;
    var res;

    res = JSON.parse(response);
    if (!res) {
        return;
    }

    success = (res.result === 'ok');
    if (success) {
        this.changePassPopup.close();
    }

    if (res.msg) {
        createMessage(res.msg, (success) ? 'msg_success' : 'msg_error');
    }

    this.changePassForm.reset();
};

/**
 * Change password form submit event handler
 */
ProfileView.prototype.onChangePassSubmit = function (e) {
    var valid = true;

    e.preventDefault();

    if (!this.oldPassInp.value || this.oldPassInp.value.length < 1) {
        this.invalidateBlock('old-pwd-inp-block');
        valid = false;
    }

    if (
        !this.newPassInp.value
        || this.newPassInp.value.length < 1
        || this.newPassInp.value === this.oldPassInp.value
    ) {
        this.invalidateBlock('new-pwd-inp-block');
        valid = false;
    }

    if (valid) {
        ajax.post({
            url: baseURL + 'api/profile/changepass',
            data: JSON.stringify({
                current: this.oldPassInp.value,
                new: this.newPassInp.value
            }),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onChangePasswordResult.bind(this)
        });
    }
};

/**
 * Show change password popup
 */
ProfileView.prototype.showChangePasswordPopup = function (e) {
    e.preventDefault();

    if (!this.changePassPopup) {
        this.changePassPopup = Popup.create({
            id: 'chpass_popup',
            title: 'Change password',
            content: this.changePassContent,
            additional: 'center_only chpass_popup'
        });

        this.changePassPopup.setControls({
            okBtn: { onclick: this.onChangePassSubmit.bind(this) },
            closeBtn: true
        });

        this.oldPassInp = ge('oldpwd');
        this.newPassInp = ge('newpwd');
        if (!this.oldPassInp || !this.newPassInp) {
            throw new Error('Failed to initialize change password dialog');
        }

        this.oldPassInp.addEventListener('input', this.onOldPasswordInput.bind(this));
        this.newPassInp.addEventListener('input', this.onNewPasswordInput.bind(this));
    }

    this.changePassPopup.show();
};

/**
 * Change name request callback
 * @param {String} response - response text
 */
ProfileView.prototype.onChangeNameResult = function (response) {
    var success;
    var res;

    res = JSON.parse(response);
    if (!res) {
        return;
    }

    success = (res.result === 'ok');
    if (success) {
        this.changeNamePopup.close();
        this.model.data.name = res.data.name;
        this.nameElem.textContent = this.model.data.name;
        this.header.setUserName(this.model.data.name);
    }

    if (res.msg) {
        createMessage(res.msg, (success) ? 'msg_success' : 'msg_error');
    }

    this.changeNameForm.reset();
};

/**
 * Change name form submit event handler
 */
ProfileView.prototype.onChangeNameSubmit = function (e) {
    var valid = true;

    e.preventDefault();

    if (
        !this.newNameInp.value
        || this.newNameInp.value.length < 1
        || this.newNameInp.value === this.model.data.name
    ) {
        this.invalidateBlock('name-inp-block');
        valid = false;
    }

    if (valid) {
        ajax.post({
            url: baseURL + 'api/profile/changename',
            data: JSON.stringify({
                name: this.newNameInp.value
            }),
            headers: { 'Content-Type': 'application/json' },
            callback: this.onChangeNameResult.bind(this)
        });
    }
};

/**
 * Show reset accounts confirmation popup
 */
ProfileView.prototype.confirmResetAccounts = function () {
    ConfirmDialog.create({
        id: 'reset_warning',
        title: 'Reset accounts',
        content: resetAccMsg,
        onconfirm: this.resetAccForm.submit.bind(this.resetAccForm)
    });
};

/**
 * Show reset all data confirmation popup
 */
ProfileView.prototype.confirmResetAll = function () {
    ConfirmDialog.create({
        id: 'reset_all_warning',
        title: 'Reset all data',
        content: resetAllMsg,
        onconfirm: this.resetAllForm.submit.bind(this.resetAllForm)
    });
};

/**
 * Show delete profile confirmation popup
 */
ProfileView.prototype.confirmDelete = function () {
    ConfirmDialog.create({
        id: 'delete_warning',
        title: 'Delete profile',
        content: deleteMsg,
        onconfirm: this.deleteForm.submit.bind(this.deleteForm)
    });
};