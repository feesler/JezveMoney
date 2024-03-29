import 'jezvejs/style';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

import { __ } from '../../utils/utils.js';
import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

import { AccountListModel } from '../../Models/AccountListModel.js';
import { CurrencyListModel } from '../../Models/CurrencyListModel.js';
import { CategoryListModel } from '../../Models/CategoryListModel.js';
import { IconListModel } from '../../Models/IconListModel.js';
import { PersonListModel } from '../../Models/PersonListModel.js';
import { ScheduledTransactionListModel } from '../../Models/ScheduledTransactionListModel.js';
import { UserCurrencyListModel } from '../../Models/UserCurrencyListModel.js';

import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { TransactionForm } from '../../Components/Transaction/TransactionForm/TransactionForm.js';

import { actions, reducer } from './reducer.js';
import './ScheduleItemView.scss';

/**
 * Create/update scheduled transaction view
 */
class ScheduleItemView extends AppView {
    constructor(...args) {
        super(...args);

        if (!('scheduleItem' in this.props)) {
            throw new Error('Invalid schedule transaction view properties');
        }

        App.loadModel(CurrencyListModel, 'currency', App.props.currency);
        App.loadModel(UserCurrencyListModel, 'userCurrencies', App.props.userCurrencies);
        App.loadModel(AccountListModel, 'accounts', App.props.accounts);
        App.loadModel(PersonListModel, 'persons', App.props.persons);
        App.loadModel(IconListModel, 'icons', App.props.icons);
        App.loadModel(CategoryListModel, 'categories', App.props.categories);
        App.loadModel(ScheduledTransactionListModel, 'schedule', App.props.schedule);
        App.initCategoriesModel();
        App.checkUserAccountModels();
        App.checkPersonModels();

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
            title: (isUpdate) ? __('schedule.update') : __('schedule.create'),
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
                title: __('actions.delete'),
                icon: 'del',
                onClick: () => this.confirmDelete(),
            });
            this.heading.actionsContainer.append(this.deleteBtn.elem);
        }

        this.subscribeToStore(this.store);
        this.form.setRenderTime();
    }

    startSubmit() {
        this.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.dispatch(actions.cancelSubmit());
    }

    onScheduleItemChange(item) {
        this.dispatch(actions.changeScheduleItem(item));
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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
            title: __('schedule.delete'),
            content: __('schedule.deleteMessage'),
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

App.createView(ScheduleItemView);
