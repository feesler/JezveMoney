import 'jezvejs/style';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

import { __ } from '../../utils/utils.js';
import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
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

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(UserCurrencyList, 'userCurrencies', App.props.userCurrencies);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.loadModel(IconList, 'icons', App.props.icons);
        App.loadModel(CategoryList, 'categories', App.props.categories);
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
