import 'jezvejs/style';
import { ge, setEvents } from 'jezvejs';
import { Application } from '../../js/Application.js';
import { ResetDataDialog } from '../../Components/Profile/ResetDataDialog/ResetDataDialog.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ChangeNameDialog } from '../../Components/Profile/ChangeNameDialog/ChangeNameDialog.js';
import { ChangePasswordDialog } from '../../Components/Profile/ChangePasswordDialog/ChangePasswordDialog.js';
import './style.scss';

/** Strings */
const VIEW_TITLE = 'Jezve Money | Profile';
const TITLE_PROFILE_DELETE = 'Delete profile';
const MSG_PROFILE_DELETE = 'Are you sure to completely delete your profile?<br>This operation can not be undone.';
const titleMap = {
    name: 'Change name',
    password: 'Change password',
    reset: 'Reset data',
};

/**
 * User profile view
 */
class ProfileView extends View {
    constructor(...args) {
        super(...args);

        this.state = {
            ...this.props,
        };
    }

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

        setEvents(this.changeNameBtn, { click: (e) => this.onActionClick(e) });
        setEvents(this.changePassBtn, { click: (e) => this.onActionClick(e) });
        setEvents(this.resetBtn, { click: (e) => this.onActionClick(e) });
        setEvents(this.delProfileBtn, { click: () => this.confirmDelete() });

        this.render(this.state);
    }

    onActionClick(e) {
        e.preventDefault();
        this.setAction(e.target.dataset.action);
    }

    onCloseDialog() {
        this.setAction(null);
    }

    setAction(action) {
        if (this.state.action === action) {
            return;
        }

        this.setState({ ...this.state, action });
    }

    onNameChanged(value) {
        window.app.model.profile.name = value;
        this.nameElem.textContent = value;
        this.header.setUserName(value);
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

    getViewTitle(state) {
        const { action } = state;
        if (!action || !titleMap[action]) {
            return VIEW_TITLE;
        }

        return `${VIEW_TITLE} | ${titleMap[action]}`;
    }

    replaceHistory(state) {
        const { baseURL } = window.app;
        const action = (state.action) ? `${state.action}/` : '';
        const url = `${baseURL}profile/${action}`;

        const title = this.getViewTitle(state);
        window.history.replaceState({}, title, url);
    }

    renderChangeNameDialog() {
        if (!this.changeNamePopup) {
            this.changeNamePopup = ChangeNameDialog.create({
                onNameChanged: (value) => this.onNameChanged(value),
                onClose: () => this.onCloseDialog(),
            });
        }

        this.changeNamePopup.show();
    }

    renderChangePasswordDialog() {
        if (!this.changePassPopup) {
            this.changePassPopup = ChangePasswordDialog.create({
                onClose: () => this.onCloseDialog(),
            });
        }

        this.changePassPopup.show();
    }

    renderResetDialog() {
        if (!this.resetPopup) {
            this.resetPopup = ResetDataDialog.create({
                onClose: () => this.onCloseDialog(),
            });
        }

        this.resetPopup.show();
    }

    render(state) {
        this.replaceHistory(state);

        if (state.action === 'password') {
            this.renderChangePasswordDialog();
        } else if (state.action === 'name') {
            this.renderChangeNameDialog();
        } else if (state.action === 'reset') {
            this.renderResetDialog();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(ProfileView);
