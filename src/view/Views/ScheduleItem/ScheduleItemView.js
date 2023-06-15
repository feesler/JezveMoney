import 'jezvejs/style';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

import { __ } from '../../utils/utils.js';
import { API } from '../../API/index.js';
import { Application } from '../../Application/Application.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';

import { AccountList } from '../../Models/AccountList.js';
import { CurrencyList } from '../../Models/CurrencyList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { IconList } from '../../Models/IconList.js';
import { PersonList } from '../../Models/PersonList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';

import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { TransactionForm } from '../../Components/TransactionForm/TransactionForm.js';

import { actions, reducer } from './reducer.js';
import './ScheduleItemView.scss';

/**
 * Create/update scheduled transaction view
 */
class ScheduleItemView extends View {
    constructor(...args) {
        super(...args);

        if (!('scheduleItem' in this.props)) {
            throw new Error('Invalid schedule transaction view properties');
        }

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(UserCurrencyList, 'userCurrencies', window.app.props.userCurrencies);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.loadModel(IconList, 'icons', window.app.props.icons);
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);
        window.app.initCategoriesModel();
        window.app.checkUserAccountModels();
        window.app.checkPersonModels();

        const initialState = {
            scheduleItem: this.props.scheduleItem,
            isUpdate: this.props.mode === 'update',
            isAvailable: this.props.trAvailable,
            submitStarted: false,
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const isUpdate = this.props.scheduleItem.id;

        this.loadElementsByIds([
            'heading',
            'formContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('SCHED_TRANS_UPDATE') : __('SCHED_TRANS_CREATE'),
            showInHeaderOnScroll: false,
        });

        this.form = TransactionForm.create({
            type: 'scheduleItem',
            transaction: this.props.scheduleItem,
            mode: this.props.mode,
            requestedType: this.props.requestedType,
            isAvailable: this.props.trAvailable,
            submitStarted: false,
            onChange: (...args) => this.onScheduleItemChange(...args),
            onSubmit: (...args) => this.submitScheduleItem(...args),
        });

        this.formContainer.append(this.form.elem);

        // Update mode
        if (isUpdate) {
            this.deleteBtn = Button.create({
                id: 'deleteBtn',
                className: 'warning-btn',
                title: __('DELETE'),
                icon: 'del',
                onClick: () => this.confirmDelete(),
            });
            this.heading.actionsContainer.append(this.deleteBtn.elem);
        }

        this.subscribeToStore(this.store);
    }

    startSubmit() {
        this.store.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.store.dispatch(actions.cancelSubmit());
    }

    onScheduleItemChange(item) {
        this.store.dispatch(actions.changeScheduleItem(item));
    }

    async submitScheduleItem(request) {
        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        this.startSubmit();

        try {
            if (state.isUpdate) {
                await API.schedule.update(request);
            } else {
                await API.schedule.create(request);
            }

            window.app.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            window.app.createErrorNotification(e.message);
        }
    }

    async deleteScheduleItem() {
        const { submitStarted, scheduleItem } = this.store.getState();
        if (submitStarted || !scheduleItem.id) {
            return;
        }

        this.startSubmit();

        try {
            await API.schedule.del({ id: scheduleItem.id });

            window.app.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            window.app.createErrorNotification(e.message);
        }
    }

    /** Show person delete confirmation popup */
    confirmDelete() {
        const { scheduleItem } = this.store.getState();
        if (!scheduleItem.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: __('SCHED_TRANS_DELETE'),
            content: __('MSG_SCHED_TRANS_DELETE'),
            onConfirm: () => this.deleteScheduleItem(),
        });
    }

    renderForm(state, prevState) {
        if (state.submitStarted === prevState?.submitStarted) {
            return;
        }

        if (state.submitStarted) {
            this.form.startSubmit();
        } else {
            this.form.cancelSubmit();
        }
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.renderForm(state, prevState);

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(ScheduleItemView);
