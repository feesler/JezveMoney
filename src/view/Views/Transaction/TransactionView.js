import 'jezvejs/style';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';

import {
    EXPENSE,
    INCOME,
    DEBT,
    TRANSFER,
    Transaction,
} from '../../Models/Transaction.js';
import { AccountListModel } from '../../Models/AccountListModel.js';
import { CurrencyListModel } from '../../Models/CurrencyListModel.js';
import { CategoryListModel } from '../../Models/CategoryListModel.js';
import { IconListModel } from '../../Models/IconListModel.js';
import { PersonListModel } from '../../Models/PersonListModel.js';
import { UserCurrencyListModel } from '../../Models/UserCurrencyListModel.js';
import { ScheduledTransactionListModel } from '../../Models/ScheduledTransactionListModel.js';
import { ReminderListModel } from '../../Models/ReminderListModel.js';

import { AppView } from '../../Components/Layout/AppView/AppView.js';
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { TransactionForm } from '../../Components/Transaction/TransactionForm/TransactionForm.js';

import { actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './TransactionView.scss';

/**
 * Create/update transaction view
 */
class TransactionView extends AppView {
    constructor(...args) {
        super(...args);
        const availModes = ['create', 'update'];

        if (!('transaction' in this.props)) {
            throw new Error('Invalid Transaction view properties');
        }

        App.loadModel(CurrencyListModel, 'currency', App.props.currency);
        App.loadModel(UserCurrencyListModel, 'userCurrencies', App.props.userCurrencies);
        App.loadModel(AccountListModel, 'accounts', App.props.accounts);
        App.loadModel(PersonListModel, 'persons', App.props.persons);
        App.loadModel(IconListModel, 'icons', App.props.icons);
        App.loadModel(CategoryListModel, 'categories', App.props.categories);
        App.loadModel(ScheduledTransactionListModel, 'schedule', App.props.schedule);
        App.loadModel(ReminderListModel, 'reminders', App.props.reminders);
        App.initCategoriesModel();

        const accountModel = App.model.accounts;

        this.mode = this.props.mode;
        if (!availModes.includes(this.mode)) {
            throw new Error(`Invalid Transaction view mode: ${this.mode}`);
        }
        if (this.props.mode === 'update') {
            accountModel.cancelTransaction(this.props.transaction);
        }

        App.checkUserAccountModels();
        App.checkPersonModels();

        const initialState = {
            transaction: this.props.transaction,
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
        const isUpdate = this.props.transaction.id;

        this.loadElementsByIds([
            'heading',
            'transactionContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('transactions.update') : __('transactions.create'),
            showInHeaderOnScroll: false,
        });

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

        this.form = TransactionForm.create({
            transaction: this.props.transaction,
            mode: this.props.mode,
            requestedType: this.props.requestedType,
            isAvailable: this.props.trAvailable,
            submitStarted: false,
            onChange: (...args) => this.onTransactionChange(...args),
            onSubmit: (...args) => this.submitTransaction(...args),
        });

        this.transactionContainer.append(this.form.elem);

        this.subscribeToStore(this.store);
        this.form.setRenderTime();
    }

    startSubmit() {
        this.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.dispatch(actions.cancelSubmit());
    }

    onTransactionChange(transaction) {
        this.dispatch(actions.changeTransaction(transaction));
    }

    async submitTransaction(request) {
        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        this.startSubmit();

        try {
            if (state.isUpdate) {
                await API.transaction.update(request);
            } else {
                await API.transaction.create(request);
            }

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
        }
    }

    async deleteTransaction() {
        const state = this.store.getState();
        if (state.submitStarted || !state.isUpdate) {
            return;
        }

        this.startSubmit();

        try {
            await API.transaction.del({ id: state.transaction.id });

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
        }
    }

    /**
     * Create and show transaction delete warning popup
     */
    confirmDelete() {
        ConfirmDialog.create({
            id: 'delete_warning',
            title: __('transactions.delete'),
            content: __('transactions.deleteMessage'),
            onConfirm: () => this.deleteTransaction(),
        });
    }

    replaceHistory(state) {
        const { baseURL } = App;
        const { transaction } = state;
        const baseAddress = (state.isUpdate)
            ? `${baseURL}transactions/update/${transaction.id}`
            : `${baseURL}transactions/create/`;

        const url = new URL(baseAddress);
        const typeStr = Transaction.getTypeString(transaction.type);
        url.searchParams.set('type', typeStr);

        if (state.isAvailable) {
            if (transaction.type === EXPENSE || transaction.type === TRANSFER) {
                url.searchParams.set('acc_id', transaction.src_id);
            } else if (transaction.type === INCOME) {
                url.searchParams.set('acc_id', transaction.dest_id);
            } else if (transaction.type === DEBT) {
                url.searchParams.set('person_id', transaction.person_id);
                url.searchParams.set('acc_id', transaction.acc_id);
            }

            if (transaction.reminder_id) {
                url.searchParams.set('reminder_id', transaction.reminder_id);
            } else if (transaction.schedule_id) {
                url.searchParams.set('schedule_id', transaction.schedule_id);
                url.searchParams.set('reminder_date', transaction.reminder_date);
            }
        }

        const title = (state.isUpdate)
            ? `${__('appName')} | ${__('transactions.update')}`
            : `${__('appName')} | ${__('transactions.create')}`;

        window.history.replaceState({}, title, url);
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

        this.replaceHistory(state);

        this.renderForm(state, prevState);

        if (!state.isAvailable) {
            return;
        }

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }
    }
}

App.createView(TransactionView);
