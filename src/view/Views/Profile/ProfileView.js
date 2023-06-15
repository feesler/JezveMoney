import 'jezvejs/style';
import { setEvents } from 'jezvejs';
import { createStore } from 'jezvejs/Store';
import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { View } from '../../utils/View.js';
import { API } from '../../API/index.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { ChangeNameDialog } from './components/ChangeNameDialog/ChangeNameDialog.js';
import { ChangePasswordDialog } from './components/ChangePasswordDialog/ChangePasswordDialog.js';
import { ResetDataDialog } from './components/ResetDataDialog/ResetDataDialog.js';
import { actions, reducer } from './reducer.js';
import '../../Components/Heading/Heading.scss';
import '../../Components/Field/Field.scss';
import '../../Application/Application.scss';
import './ProfileView.scss';

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

        const { profile } = App.model;
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
        App.model.profile.name = value;
        this.header.setUserName(value);
        this.store.dispatch(actions.changeUserName(value));
    }

    /** Send delete profile API request */
    async requestDeleteProfile() {
        this.deleteLoading.show();

        try {
            await API.profile.del();
            window.location = `${App.baseURL}login/`;
        } catch (e) {
            App.createErrorNotification(e.message);
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
        const { baseURL } = App;
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

App.createView(ProfileView);
