import 'jezvejs/style';
import {
    ge,
    show,
    asArray,
    createElement,
    removeChilds,
} from 'jezvejs';
import 'jezvejs/style/IconButton';
import { Histogram } from 'jezvejs/Histogram';
import { PopupMenu } from 'jezvejs/PopupMenu';
import { API } from '../../js/api/index.js';
import { formatValueShort, normalize, __ } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { IconList } from '../../js/model/IconList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { ListContainer } from '../../Components/ListContainer/ListContainer.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import { Field } from '../../Components/Field/Field.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import '../../Components/Tile/style.scss';
import './style.scss';
import { createStore } from '../../js/store.js';
import { reducer, actions } from './reducer.js';

/**
 * Main view
 */
class MainView extends View {
    constructor(...args) {
        super(...args);

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.checkUserAccountModels();
        window.app.loadModel(PersonList, 'persons', window.app.props.persons);
        window.app.checkPersonModels();
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);
        window.app.loadModel(IconList, 'icons', window.app.props.icons);

        const initialState = {
            transactions: [...this.props.transactions],
            accounts: {
                visible: AccountList.create(window.app.model.visibleUserAccounts),
            },
            persons: {
                visible: PersonList.create(window.app.model.visiblePersons),
            },
            chartData: this.props.chartData,
            showCategoryDialog: false,
            categoryDialog: {
                categoryId: 0,
            },
            loading: true,
            transactionContextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const { baseURL } = window.app;
        const state = this.store.getState();

        this.loadElementsByIds([
            'contentContainer',
            'accountsWidget',
            'personsWidget',
        ]);

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create();
        this.contentContainer.append(this.loadingIndicator.elem);
        this.loadingIndicator.show(state.loading);

        // Accounts widget
        this.visibleAccounts = ListContainer.create({
            ItemComponent: AccountTile,
            getItemProps: (account, { listMode }) => ({
                type: 'link',
                link: `${baseURL}transactions/create/?acc_id=${account.id}`,
                account,
                attrs: { 'data-id': account.id },
                selected: account.selected ?? false,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: '.tile',
            listMode: 'list',
            items: state.accounts.visible,
            noItemsMessage: () => this.renderAccountsNoData(),
        });
        this.accountsWidget.append(this.visibleAccounts.elem);

        // Totals widget
        this.totalWidget = ge('totalWidget');
        if (this.totalWidget) {
            this.totalList = createElement('div', {
                props: { className: 'total-list' },
            });
            this.totalWidget.append(this.totalList);
        }

        // Persons widget
        this.visiblePersons = ListContainer.create({
            ItemComponent: Tile,
            getItemProps: (person, { listMode }) => ({
                type: 'link',
                link: `${baseURL}transactions/create/?type=debt&person_id=${person.id}`,
                attrs: { 'data-id': person.id },
                title: person.name,
                subtitle: this.formatPersonDebts(person),
                selected: person.selected,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: '.tile',
            listMode: 'list',
            items: state.persons.visible,
            noItemsMessage: () => this.renderPersonsNoData(),
        });
        this.personsWidget.append(this.visiblePersons.elem);

        // Latest transactions widget
        this.transactionsWidget = ge('transactionsWidget');
        if (this.transactionsWidget) {
            this.latestList = TransactionList.create({
                items: this.props.transactions,
                listMode: 'list',
                showControls: true,
                noItemsMessage: __('MAIN_TR_NO_DATA'),
                onItemClick: (id, e) => this.onTransactionClick(id, e),
            });
            this.transactionsWidget.append(this.latestList.elem);
        }

        // Statistics widget
        const chart = ge('chart');
        if (chart) {
            this.histogram = Histogram.create({
                data: this.props.chartData,
                height: 200,
                renderYAxisLabel: (value) => formatValueShort(value),
            });
            chart.append(this.histogram.elem);
        }

        this.createTransactionContextMenu();

        this.subscribeToStore(this.store);
        this.stopLoading();
    }

    /** Creates context menu for latest transactions list */
    createTransactionContextMenu() {
        this.transactionContextMenu = PopupMenu.create({
            id: 'contextMenu',
            attached: true,
            items: [{
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxSetCategoryBtn',
                title: __('SET_CATEGORY'),
                onClick: () => this.showCategoryDialog(true),
            }, {
                type: 'separator',
            }, {
                id: 'ctxDeleteBtn',
                icon: 'del',
                title: __('DELETE'),
                onClick: () => this.confirmDelete(),
            }],
        });
    }

    createSetCategoryDialog() {
        if (this.setCategoryDialog) {
            return;
        }

        this.categorySelect = CategorySelect.create({
            className: 'dd_fullwidth',
            onchange: (category) => this.onChangeCategorySelect(category),
        });
        this.categoryField = Field.create({
            title: __('TR_CATEGORY'),
            content: this.categorySelect.elem,
            className: 'view-row',
        });

        this.setCategoryDialog = ConfirmDialog.create({
            id: 'selectCategoryDialog',
            title: __('TR_SET_CATEGORY'),
            content: this.categoryField.elem,
            className: 'category-dialog',
            destroyOnResult: false,
            onconfirm: () => this.setItemsCategory(),
            onreject: () => this.closeCategoryDialog(),
        });
    }

    /** Shows context menu for specified item */
    showContextMenu(itemId) {
        this.store.dispatch(actions.showTransactionContextMenu(itemId));
    }

    showCategoryDialog() {
        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        this.store.dispatch(actions.showCategoryDialog(ids));
    }

    closeCategoryDialog() {
        this.store.dispatch(actions.closeCategoryDialog());
    }

    /** Set loading state and render view */
    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    /** Update render time */
    setRenderTime() {
        this.store.dispatch(actions.setRenderTime());
    }

    /** Transaction list 'click' event handler */
    onTransactionClick(itemId, e) {
        if (e?.target?.closest('.popup-menu-btn')) {
            this.showContextMenu(itemId);
        }
    }

    /** Transaction category select 'change' event handler */
    onChangeCategorySelect(category) {
        this.store.dispatch(actions.changeCategorySelect(category.id));
    }

    /** Returns currently slelected transactions */
    getContextIds() {
        const state = this.store.getState();
        return asArray(state.transactionContextItem);
    }

    /** Sends API request to change category of selected transactions */
    async setItemsCategory() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const { ids, categoryId } = state.categoryDialog;
        if (ids.length === 0) {
            return;
        }

        this.closeCategoryDialog();
        this.startLoading();

        try {
            await API.transaction.setCategory({ id: ids, category_id: categoryId });
            this.requestState();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
            this.setRenderTime();
        }
    }

    /** Sends delete transaction API request */
    async deleteItems() {
        const state = this.store.getState();
        if (state.loading) {
            return;
        }

        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        this.startLoading();

        try {
            await API.transaction.del({ id: ids });
            this.requestState();
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.stopLoading();
            this.setRenderTime();
        }
    }

    /** Sends /state/main API request */
    async requestState() {
        this.startLoading();

        try {
            const result = await API.state.main();
            const { accounts, persons } = result.data;

            window.app.model.accounts.setData(accounts.data);
            window.app.model.userAccounts = null;
            window.app.checkUserAccountModels();

            window.app.model.persons.setData(persons.data);
            window.app.model.visiblePersons = null;
            window.app.checkPersonModels();

            this.store.dispatch(actions.listRequestLoaded(result.data));
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
        }

        this.stopLoading();
        this.setRenderTime();
    }

    /** Creates and show transaction delete warning popup */
    confirmDelete() {
        const ids = this.getContextIds();
        if (ids.length === 0) {
            return;
        }

        const multi = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multi) ? __('TR_DELETE_MULTIPLE') : __('TR_DELETE'),
            content: (multi) ? __('MSG_TRANS_DELETE_MULTIPLE') : __('MSG_TRANS_DELETE'),
            onconfirm: () => this.deleteItems(),
        });
    }

    /** Returns accounts 'No data' container */
    renderAccountsNoData() {
        return this.renderNoDataGroup(
            __('MAIN_ACCOUNTS_NO_DATA'),
            `${window.app.baseURL}accounts/create/`,
        );
    }

    /** Returns persons 'No data' container */
    renderPersonsNoData() {
        return this.renderNoDataGroup(
            __('PERSONS_NO_DATA'),
            `${window.app.baseURL}persons/create/`,
        );
    }

    /** Returns container with 'No data' message and create link */
    renderNoDataGroup(message, createURL) {
        return createElement('div', {
            props: { className: 'nodata-group' },
            children: [
                createElement('span', {
                    props: {
                        className: 'nodata-message',
                        textContent: message,
                    },
                }),
                createElement('a', {
                    props: {
                        className: 'btn link-btn',
                        href: createURL,
                        textContent: __('CREATE'),
                    },
                }),
            ],
        });
    }

    /** Renders accounts widget */
    renderAccountsWidget(state, prevState) {
        if (
            state.accounts.visible === prevState?.accounts?.visible
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        this.visibleAccounts.setState((visibleState) => ({
            ...visibleState,
            items: state.accounts.visible,
            renderTime: state.renderTime,
        }));
    }

    /** Renders list item of totals widget */
    renderTotalsListItem(item) {
        const { currency } = window.app.model;
        return createElement('li', {
            props: {
                className: 'total-list__item',
                textContent: currency.formatCurrency(item.balance, item.curr_id),
            },
        });
    }

    /** Renders totals widget */
    renderTotalsWidget() {
        const { userAccounts } = window.app.model;
        const noAccounts = userAccounts.length === 0;

        show(this.totalWidget, !noAccounts);
        if (noAccounts) {
            return;
        }

        const totals = {};
        userAccounts.forEach((account) => {
            if (typeof totals[account.curr_id] === 'undefined') {
                totals[account.curr_id] = {
                    balance: 0,
                    curr_id: account.curr_id,
                };
            }

            const item = totals[account.curr_id];
            item.balance = normalize(item.balance + account.balance);
        });

        const elems = Object.values(totals).map((item) => this.renderTotalsListItem(item));
        removeChilds(this.totalList);
        this.totalList.append(...elems);
    }

    /** Returns array of formatted debts of person or 'No debts' string */
    formatPersonDebts(person) {
        const debtAccounts = person.accounts.filter((account) => account.balance !== 0);
        if (debtAccounts.length === 0) {
            return __('PERSON_NO_DEBTS');
        }

        const { currency } = window.app.model;
        return debtAccounts.map((account) => (
            currency.formatCurrency(account.balance, account.curr_id)
        ));
    }

    /** Renders persons widget */
    renderPersonsWidget(state, prevState) {
        if (
            state.persons.visible === prevState?.persons?.visible
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        this.visiblePersons.setState((visibleState) => ({
            ...visibleState,
            items: state.persons.visible,
            renderTime: state.renderTime,
        }));
    }

    /** Renders transaction context menu */
    renderTransactionContextMenu(state, prevState) {
        if (state.transactionContextItem === prevState?.transactionContextItem) {
            return;
        }

        const itemId = state.transactionContextItem;
        if (!itemId) {
            this.transactionContextMenu.detach();
            return;
        }
        const listItem = this.latestList.getListItemById(itemId);
        const menuContainer = listItem?.elem?.querySelector('.popup-menu');
        if (!menuContainer) {
            this.transactionContextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.transactionContextMenu;
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.transactionContextMenu.attachAndShow(menuContainer);
    }

    /** Renders transactions widget */
    renderTransactionsWidget(state, prevState) {
        if (state.transactions.length === 0) {
            return;
        }

        this.renderTransactionContextMenu(state, prevState);

        this.latestList.setState((listState) => ({
            ...listState,
            items: state.transactions,
            renderTime: state.renderTime,
        }));
    }

    /** Renders statistics widget */
    renderStatisticsWidget(state) {
        if (!this.histogram) {
            return;
        }

        this.histogram.setData(state.chartData);
    }

    /** Renders 'Set transaction category' dialog */
    renderCategoryDialog(state, prevState) {
        if (state.showCategoryDialog === prevState?.showCategoryDialog) {
            return;
        }

        if (state.showCategoryDialog) {
            this.createSetCategoryDialog();
        }
        this.setCategoryDialog?.show(state.showCategoryDialog);
        this.categorySelect?.selectItem(state.categoryDialog.categoryId);
    }

    /** Renders view state */
    render(state, prevState = {}) {
        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderAccountsWidget(state, prevState);
        this.renderTotalsWidget(state, prevState);
        this.renderPersonsWidget(state, prevState);
        this.renderTransactionsWidget(state, prevState);
        this.renderStatisticsWidget(state, prevState);

        this.renderCategoryDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(MainView);
