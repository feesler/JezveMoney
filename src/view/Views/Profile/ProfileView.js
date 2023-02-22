import 'jezvejs/style';
import { setEvents } from 'jezvejs';
import { __ } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ChangeNameDialog } from './components/ChangeNameDialog/ChangeNameDialog.js';
import { ChangePasswordDialog } from './components/ChangePasswordDialog/ChangePasswordDialog.js';
import { ResetDataDialog } from './components/ResetDataDialog/ResetDataDialog.js';
import { createStore } from '../../js/store.js';
import { actions, reducer } from './reducer.js';
import '../../Components/Heading/style.scss';
import '../../Components/Field/style.scss';
import './style.scss';

const titleMap = {
    name: __('PROFILE_CHANGE_NAME'),
    password: __('PROFILE_CHANGE_PASS'),
    reset: __('PROFILE_RESET_DATA'),
};

/**
 * User profile view
 */
class ProfileView extends View {
    constructor(...args) {
        super(...args);

        const { profile } = window.app.model;
        const initialState = {
            ...this.props,
            userName: profile.name,
        };

        this.store = createStore(reducer, { initialState });
    }

    /** View initialization */
    onStart() {
        this.loadElementsByIds([
            'userNameTitle',
            'changeNameBtn',
            'changePassBtn',
            'resetBtn',
            'delProfileBtn',
        ]);

        setEvents(this.changeNameBtn, { click: (e) => this.onActionClick(e) });
        setEvents(this.changePassBtn, { click: (e) => this.onActionClick(e) });
        setEvents(this.resetBtn, { click: (e) => this.onActionClick(e) });
        setEvents(this.delProfileBtn, { click: () => this.confirmDelete() });

        this.changeNamePopup = null;
        this.changePassPopup = null;
        this.resetPopup = null;

        this.subscribeToStore(this.store);
    }

    onActionClick(e) {
        e.preventDefault();
        this.setAction(e.target.dataset.action);
    }

    onCloseDialog() {
        this.setAction(null);
    }

    setAction(action) {
        this.store.dispatch(actions.changeAction(action));
    }

    onNameChanged(value) {
        window.app.model.profile.name = value;
        this.header.setUserName(value);
        this.store.dispatch(actions.changeUserName(value));
    }

    /** Send delete profile API request */
    async requestDeleteProfile() {
        this.deleteLoading.show();

        try {
            await API.profile.del();
            window.location = `${window.app.baseURL}login/`;
        } catch (e) {
            window.app.createErrorNotification(e.message);
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
            title: __('PROFILE_DELETE'),
            content: __('MSG_PROFILE_DELETE'),
            onConfirm: () => this.requestDeleteProfile(),
        });
    }

    getViewTitle(state) {
        const viewTitle = `${__('APP_NAME')} | ${__('PROFILE')}`;
        const { action } = state;
        if (!action || !titleMap[action]) {
            return viewTitle;
        }

        return `${viewTitle} | ${titleMap[action]}`;
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

        this.userNameTitle.textContent = state.userName;

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
