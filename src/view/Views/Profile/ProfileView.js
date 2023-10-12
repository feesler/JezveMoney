import 'jezvejs/style';
import { createElement } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

// Application
import { __, getApplicationURL } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import { API } from '../../API/index.js';

// Common components
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { ChangeNameDialog } from './components/ChangeNameDialog/ChangeNameDialog.js';
import { ChangePasswordDialog } from './components/ChangePasswordDialog/ChangePasswordDialog.js';
import { ResetDataDialog } from './components/ResetDataDialog/ResetDataDialog.js';
import { Section } from '../../Components/Layout/Section/Section.js';

import { actions, reducer } from './reducer.js';
import '../../Components/Common/Field/Field.scss';
import '../../Application/Application.scss';
import './ProfileView.scss';

const titleMap = {
    name: __('profile.changeName'),
    password: __('profile.changePassword'),
    reset: __('profile.resetData'),
};

/**
 * User profile view
 */
class ProfileView extends AppView {
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
            'mainContent',
        ]);

        this.createLoginSection();
        this.createNameSection();
        this.createSecuritySection();
        this.createUserDataSection();

        this.mainContent.append(
            this.loginSection.elem,
            this.nameSection.elem,
            this.securitySection.elem,
            this.securitySection.elem,
            this.userDataSection.elem,
        );

        this.changeNamePopup = null;
        this.changePassPopup = null;
        this.resetPopup = null;

        this.subscribeToStore(this.store);
    }

    createLoginSection() {
        const loginElem = createElement('span', {
            props: {
                textContent: App.userLogin,
            },
        });

        this.loginSection = Section.create({
            id: 'loginSection',
            title: __('profile.login'),
            content: [
                loginElem,
            ],
        });
    }

    createNameSection() {
        this.userNameTitle = createElement('span', {
            props: {
                id: 'userNameTitle',
                textContent: App.userName,
            },
        });

        this.changeNameBtn = this.createActionButton({
            id: 'changeNameBtn',
            className: 'change-name-link',
            action: 'name',
            title: __('actions.update'),
        });

        this.nameSection = Section.create({
            id: 'loginSection',
            title: __('profile.name'),
            content: createElement('div', {
                props: { className: 'name-container' },
                children: [
                    this.userNameTitle,
                    this.changeNameBtn,
                ],
            }),
        });
    }

    createActionButton(options) {
        const {
            action,
            title,
            ...rest
        } = options;

        return createElement('a', {
            props: {
                href: getApplicationURL(`profile/${action}/`),
                textContent: title,
                dataset: { action },
                ...rest,
            },
            events: { click: (e) => this.onActionClick(e) },
        });
    }

    createSecuritySection() {
        this.changePassBtn = this.createActionButton({
            id: 'changePassBtn',
            action: 'password',
            title: __('profile.changePassword'),
        });

        this.securitySection = Section.create({
            id: 'securitySection',
            title: __('profile.security'),
            content: this.changePassBtn,
        });
    }

    createUserDataSection() {
        // Reset data
        this.resetDataDescr = createElement('span', {
            props: { textContent: __('profile.userDataDescription') },
        });

        this.resetBtn = this.createActionButton({
            id: 'resetBtn',
            action: 'reset',
            title: __('profile.resetData'),
        });

        this.resetBtn = createElement('a', {
            props: {
                id: 'resetBtn',
                className: 'change-name-link',
                href: getApplicationURL('profile/reset/'),
                textContent: __('profile.resetData'),
                dataset: { action: 'reset' },
            },
            events: { click: (e) => this.onActionClick(e) },
        });

        // Delete profile
        this.deleteProfileDescr = createElement('span', {
            props: { textContent: __('profile.deleteDescription') },
        });

        this.delProfileBtn = Button.create({
            id: 'delProfileBtn',
            className: 'warning-btn',
            title: __('profile.delete'),
            onClick: () => this.confirmDelete(),
        });

        this.userDataSection = Section.create({
            id: 'userDataSection',
            title: __('profile.userData'),
            content: [
                App.createContainer('profile-block__section', [
                    this.resetDataDescr,
                    this.resetBtn,
                ]),
                App.createContainer('profile-block__section', [
                    this.deleteProfileDescr,
                    this.delProfileBtn.elem,
                ]),
            ],
        });
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
            title: __('profile.delete'),
            content: __('profile.deleteMessage'),
            onConfirm: () => this.requestDeleteProfile(),
        });
    }

    getViewTitle(state) {
        const viewTitle = `${__('appName')} | ${__('profile.title')}`;
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
