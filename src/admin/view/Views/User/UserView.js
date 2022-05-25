import 'jezvejs/style';
import {
    ge,
    ce,
    show,
    enable,
} from 'jezvejs';
import { AdminListView } from '../../js/AdminListView.js';
import '../../../../view/css/app.css';
import '../../css/admin.css';

/**
 * Admin currecny list view
 */
class AdminUserListView extends AdminListView {
    constructor(...args) {
        super(...args);

        this.apiController = 'user';
        this.deleteConfirmMessage = 'Are you sure want to delete selected user?';
    }

    /**
     * View initialization
     */
    onStart(...args) {
        super.onStart(...args);

        this.idInput = ge('user_id');
        this.loginBlock = ge('login_block');
        this.loginInput = ge('user_login');
        this.nameBlock = ge('name_block');
        this.nameInput = ge('user_name');
        this.passwordBlock = ge('pwd_block');
        this.passwordInput = ge('user_pass');
        this.adminBlock = ge('admin_block');
        this.adminRadio = ge('isadmin');
        this.testerRadio = ge('istester');
        this.defaultRadio = ge('isdefault');

        this.changePassBtn = ge('passbtn');
        if (this.changePassBtn) {
            this.changePassBtn.addEventListener('click', this.setUserPass.bind(this));
        }
    }

    /**
     * Set up fields of form for specified item
     * @param {*} item - if set to null create mode is assumed, if set to object then update mode
     */
    setItemValues(item) {
        if (item) {
            this.idInput.value = item.id;
            this.loginInput.value = item.login;
            this.nameInput.value = item.name;
            this.adminRadio.checked = (item.access === 1);
            this.testerRadio.checked = (item.access === 2);
            this.defaultRadio.checked = (item.access === 0);
        } else {
            this.idInput.value = '';
            this.loginInput.value = '';
            this.nameInput.value = '';
            this.adminRadio.checked = false;
            this.testerRadio.checked = false;
            this.defaultRadio.checked = false;
        }
        this.passwordInput.value = '';
    }

    /**
     * Process item selection
     * @param {*} id - item identificator
     */
    selectItem(...args) {
        super.selectItem(...args);

        show(this.changePassBtn, (this.selectedItem != null));
    }

    /**
     * Before show create item dialog
     */
    preCreateItem() {
        this.dialogPopup.setTitle('Create user');

        show(this.loginBlock, true);
        enable(this.loginInput, true);
        show(this.nameBlock, true);
        enable(this.nameInput, true);
        show(this.passwordBlock, true);
        enable(this.passwordInput, true);
        show(this.adminBlock, true);
        enable(this.adminRadio, true);
        enable(this.testerRadio, true);
        enable(this.defaultRadio, true);
    }

    /**
     * Before show update item dialog
     */
    preUpdateItem() {
        this.dialogPopup.setTitle('Update user');

        show(this.loginBlock, true);
        enable(this.loginInput, true);
        show(this.nameBlock, true);
        enable(this.nameInput, true);
        show(this.passwordBlock, true);
        enable(this.passwordInput, true);
        show(this.adminBlock, true);
        enable(this.adminRadio, true);
        enable(this.testerRadio, true);
        enable(this.defaultRadio, true);
    }

    /**
     * Change password button click handler
     */
    setUserPass() {
        this.dialogPopup.setTitle('Set password');

        show(this.loginBlock, false);
        enable(this.loginInput, false);
        show(this.nameBlock, false);
        enable(this.nameInput, false);
        show(this.passwordBlock, true);
        this.passwordInput.value = '';
        enable(this.passwordInput, true);
        show(this.adminBlock, false);
        enable(this.adminRadio, false);
        enable(this.testerRadio, false);
        enable(this.defaultRadio, false);

        const { baseURL } = window.app;
        this.itemForm.action = `${baseURL}api/${this.apiController}/changePassword`;

        this.dialogPopup.show();
    }

    /**
     * Render list element for specified item
     * @param {object} item - item object
     */
    renderItem(item) {
        const accessLevels = {
            0: 'Default',
            1: 'Admin',
            2: 'Tester',
        };

        if (!item) {
            return null;
        }

        let accessTitle;
        if (accessLevels[item.access]) {
            accessTitle = accessLevels[item.access];
        } else {
            accessTitle = `Unknown access level: ${item.access}`;
        }

        return ce('tr', {}, [
            ce('td', { textContent: item.id }),
            ce('td', { textContent: item.login }),
            ce('td', { textContent: item.name }),
            ce('td', { textContent: accessTitle }),
            ce('td', { textContent: item.accCount }),
            ce('td', { textContent: item.trCount }),
            ce('td', { textContent: item.pCount }),
        ]);
    }
}

window.view = new AdminUserListView(window.app);
