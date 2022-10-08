import 'jezvejs/style';
import { ge, setEvents } from 'jezvejs';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ChangeNameDialog } from '../../Components/Profile/ChangeNameDialog/ChangeNameDialog.js';
import { ChangePasswordDialog } from '../../Components/Profile/ChangePasswordDialog/ChangePasswordDialog.js';
import { ResetDataDialog } from '../../Components/Profile/ResetDataDialog/ResetDataDialog.js';
import '../../css/app.scss';
import './style.scss';

/** Strings */
const TITLE_PROFILE_DELETE = 'Delete profile';
const MSG_PROFILE_DELETE = 'Are you sure to completely delete your profile?<br>This operation can not be undone.';

/**
 * User profile view
 */
class ProfileView extends View {
    /** View initialization */
    onStart() {
        this.changeNamePopup = null;
        this.changePassPopup = null;
        this.resetPopup = null;

        this.nameElem = ge('namestatic');
        this.changeNameBtn = ge('changeNameBtn');
        this.changePassBtn = ge('changePassBtn');
        this.resetBtn = ge('resetBtn');
        this.delProfileBtn = ge('delProfileBtn');
        if (
            !this.nameElem
            || !this.changeNameBtn
            || !this.changePassBtn
            || !this.resetBtn
            || !this.delProfileBtn
        ) {
            throw new Error('Failed to initialize Profile view');
        }

        setEvents(this.changeNameBtn, { click: (e) => this.showChangeNamePopup(e) });
        setEvents(this.changePassBtn, { click: (e) => this.showChangePasswordPopup(e) });
        setEvents(this.resetBtn, { click: () => this.showResetPopup() });
        setEvents(this.delProfileBtn, { click: () => this.confirmDelete() });

        if (this.props.action) {
            if (this.props.action === 'changePass') {
                this.showChangePasswordPopup();
            } else if (this.props.action === 'changeName') {
                this.showChangeNamePopup();
            }
        }
    }

    /** Show change name popup */
    showChangeNamePopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.changeNamePopup) {
            this.changeNamePopup = ChangeNameDialog.create({
                onNameChanged: (value) => this.onNameChanged(value),
            });
        }

        this.changeNamePopup.show();
    }

    onNameChanged(value) {
        window.app.model.profile.name = value;
        this.nameElem.textContent = value;
        this.header.setUserName(value);
    }

    /** Show change password popup */
    showChangePasswordPopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.changePassPopup) {
            this.changePassPopup = ChangePasswordDialog.create();
        }

        this.changePassPopup.show();
    }

    /** Show reset popup */
    showResetPopup(e) {
        if (e) {
            e.preventDefault();
        }

        if (!this.resetPopup) {
            this.resetPopup = ResetDataDialog.create();
        }

        this.resetPopup.show();
    }

    /** Send delete profile API request */
    async requestDeleteProfile() {
        this.deleteLoading.show();

        try {
            await API.profile.del();
            window.location = `${window.app.baseURL}login/`;
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.deleteLoading.hide();
        }
    }

    /** Show delete profile confirmation popup */
    confirmDelete() {
        if (!this.deleteLoading) {
            this.deleteLoading = LoadingIndicator.create({ fixed: false });
            document.documentElement.append(this.deleteLoading.elem);
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PROFILE_DELETE,
            content: MSG_PROFILE_DELETE,
            onconfirm: () => this.requestDeleteProfile(),
        });
    }
}

window.app = new Application(window.appProps);
window.app.createView(ProfileView);
