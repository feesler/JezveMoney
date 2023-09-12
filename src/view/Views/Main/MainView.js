import 'jezvejs/style';
import {
    ge,
    show,
    asArray,
    createElement,
    removeChilds,
    isFunction,
} from 'jezvejs';
import 'jezvejs/style/Button';
import { Histogram } from 'jezvejs/Histogram';
import { ListContainer } from 'jezvejs/ListContainer';
import { createStore } from 'jezvejs/Store';
import { TabList } from 'jezvejs/TabList';

import { API } from '../../API/index.js';
import { normalize } from '../../utils/decimal.js';
import {
    formatNumberShort,
    formatPersonDebts,
    getCurrencyPrecision,
    listData,
    __,
} from '../../utils/utils.js';
import { SetCategoryDialog } from '../../Components/SetCategoryDialog/SetCategoryDialog.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/AppView/AppView.js';
import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { IconList } from '../../Models/IconList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import { TransactionListContextMenu } from '../../Components/TransactionListContextMenu/TransactionListContextMenu.js';
import { reducer, actions } from './reducer.js';
import './MainView.scss';
import { NoDataGroup } from './components/NoDataGroup/NoDataGroup.js';

/**
 * Main view
 */
class MainView extends AppView {
    constructor(...args) {
        super(...args);

        this.trContextMenuActions = {
            ctxSetCategoryBtn: () => this.showCategoryDialog(),
            ctxDeleteBtn: () => this.confirmDelete(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.checkUserAccountModels();
        App.loadModel(PersonList, 'persons', App.props.persons);
        App.checkPersonModels();
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.initCategoriesModel();
        App.loadModel(IconList, 'icons', App.props.icons);

        const initialState = {
            transactions: [...this.props.transactions],
            accounts: {
                visible: AccountList.create(App.model.visibleUserAccounts),
                hidden: AccountList.create(App.model.hiddenUserAccounts),
                showHidden: false,
            },
            persons: {
                visible: PersonList.create(App.model.visiblePersons),
                hidden: PersonList.create(App.model.hiddenPersons),
                showHidden: false,
            },
            chartData: this.props.chartData,
            categoryDialog: {
                show: false,
                categoryId: 0,
                type: 0,
            },
            loading: true,
            showContextMenu: false,
            transactionContextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const { baseURL } = App;
        const state = this.store.getState();

        this.loadElementsByIds([
            'contentContainer',
            'summaryWidget',
            'chart',
        ]);

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create();
        this.contentContainer.append(this.loadingIndicator.elem);
        this.loadingIndicator.show(state.loading);

        // Summary widget

        // Accounts tab
        const accountsProps = {
            ItemComponent: AccountTile,
            getItemProps: (account, { listMode }) => ({
                type: 'link',
                link: `${baseURL}transactions/create/?acc_id=${account.id}`,
                account,
                selected: account.selected ?? false,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: AccountTile.selector,
            listMode: 'list',
            PlaceholderComponent: NoDataGroup,
            getPlaceholderProps: () => ({
                title: __('main.noAccounts'),
                url: `${App.baseURL}accounts/create/`,
            }),
        };

        this.visibleAccounts = ListContainer.create({
            ...accountsProps,
            items: listData(state.accounts.visible),
        });

        this.hiddenAccounts = ListContainer.create({
            ...accountsProps,
            items: listData(state.accounts.hidden),
        });

        this.toggleAccountsBtn = this.createToggleShowAllButton({
            onClick: () => this.toggleHiddenAccounts(),
        });

        // Persons tab
        const personProps = {
            ItemComponent: Tile,
            getItemProps: (person, { listMode }) => ({
                id: person.id,
                type: 'link',
                link: `${baseURL}transactions/create/?type=debt&person_id=${person.id}`,
                title: person.name,
                subtitle: formatPersonDebts(person),
                selected: person.selected,
                selectMode: listMode === 'select',
            }),
            className: 'tiles',
            itemSelector: Tile.selector,
            listMode: 'list',
            PlaceholderComponent: NoDataGroup,
            getPlaceholderProps: () => ({
                title: __('persons.noData'),
                url: `${App.baseURL}persons/create/`,
            }),
        };

        this.visiblePersons = ListContainer.create({
            ...personProps,
            items: listData(state.persons.visible),
        });

        this.hiddenPersons = ListContainer.create({
            ...personProps,
            items: listData(state.persons.hidden),
        });

        this.togglePersonsBtn = this.createToggleShowAllButton({
            onClick: () => this.toggleHiddenPersons(),
        });

        this.summaryTabs = TabList.create({
            items: [{
                id: 'accounts',
                value: 'accounts',
                title: __('accounts.listTitle'),
                content: [
                    this.visibleAccounts.elem,
                    this.hiddenAccounts.elem,
                    this.toggleAccountsBtn,
                ],
            }, {
                id: 'persons',
                value: 'persons',
                title: __('persons.listTitle'),
                content: [
                    this.visiblePersons.elem,
                    this.hiddenPersons.elem,
                    this.togglePersonsBtn,
                ],
            }],
        });

        this.summaryWidget.append(this.summaryTabs.elem);

        // Totals widget
        this.totalWidget = ge('totalWidget');
        if (this.totalWidget) {
            this.totalList = createElement('ul', {
                props: { className: 'total-list' },
            });
            this.totalWidget.append(this.totalList);
        }

        // Latest transactions widget
        this.transactionsWidget = ge('transactionsWidget');
        if (this.transactionsWidget) {
            this.latestList = TransactionList.create({
                items: this.props.transactions,
                listMode: 'list',
                showControls: true,
                getPlaceholderProps: () => ({ title: __('main.noTransactions') }),
                onItemClick: (id, e) => this.onTransactionClick(id, e),
            });
            this.transactionsWidget.append(this.latestList.elem);
        }

        // Statistics widget
        this.histogram = Histogram.create({
            data: this.props.chartData,
            height: 200,
            renderXAxisLabel: (value) => App.formatDate(value),
            renderYAxisLabel: (value) => formatNumberShort(value),
        });

        this.statNoDataMessage = createElement('span', {
            props: {
                className: 'nodata-message',
                textContent: __('statistics.noData'),
            },
        });

        this.chart.append(this.statNoDataMessage, this.histogram.elem);

        this.subscribeToStore(this.store);
        this.stopLoading();
    }

    createToggleShowAllButton(props = {}) {
        const events = {};
        if (isFunction(props?.onClick)) {
            events.click = props.onClick;
        }

        return createElement('button', {
            props: {
                className: 'btn link-btn',
                type: 'button',
                textContent: __('actions.showAll'),
            },
            events,
        });
    }

    onContextMenuClick(item) {
        this.hideContextMenu();

        const menuAction = this.trContextMenuActions[item];
        if (isFunction(menuAction)) {
            menuAction();
        }
    }

    /** Toggle shows/hides hidden accounts */
    toggleHiddenAccounts() {
        this.store.dispatch(actions.toggleHiddenAccounts());
    }

    /** Toggle shows/hides hidden persons */
    toggleHiddenPersons() {
        this.store.dispatch(actions.toggleHiddenPersons());
    }

    /** Shows context menu for specified item */
    showContextMenu(itemId) {
        this.store.dispatch(actions.showTransactionContextMenu(itemId));
    }

    /** Hides context menu */
    hideContextMenu() {
        this.store.dispatch(actions.hideTransactionContextMenu());
    }

    showCategoryDialog() {
        const ids = this.getContextIds();
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
        if (e?.target?.closest('.menu-btn')) {
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
            App.createErrorNotification(e.message);
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
            App.createErrorNotification(e.message);
            this.stopLoading();
            this.setRenderTime();
        }
    }

    /** Sends /state/main API request */
    async requestState() {
        this.startLoading();

        try {
            const result = await API.state.main();
            const { accounts, persons, profile } = result.data;

            App.updateProfile(profile);

            App.model.accounts.setData(accounts.data);
            App.model.userAccounts = null;
            App.checkUserAccountModels();

            App.model.persons.setData(persons.data);
            App.model.visiblePersons = null;
            App.checkPersonModels();

            this.store.dispatch(actions.listRequestLoaded(result.data));
        } catch (e) {
            App.createErrorNotification(e.message);
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
            title: (multi) ? __('transactions.deleteMultiple') : __('transactions.delete'),
            content: (multi) ? __('transactions.deleteMultipleMessage') : __('transactions.deleteMessage'),
            onConfirm: () => this.deleteItems(),
        });
    }

    /** Renders accounts widget */
    renderAccountsWidget(state, prevState) {
        if (
            state.accounts.visible === prevState?.accounts?.visible
            && state.accounts.hidden === prevState?.accounts?.hidden
            && state.accounts.showHidden === prevState?.accounts?.showHidden
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        this.visibleAccounts.setState((listState) => ({
            ...listState,
            items: listData(state.accounts.visible),
            renderTime: state.renderTime,
        }));

        const hiddenAvailable = state.accounts.hidden.length > 0;

        show(this.toggleAccountsBtn, hiddenAvailable);
        this.toggleAccountsBtn.textContent = (state.accounts.showHidden)
            ? __('actions.showVisible')
            : __('actions.showAll');

        this.hiddenAccounts.setState((listState) => ({
            ...listState,
            items: listData(state.accounts.hidden),
            renderTime: state.renderTime,
        }));
        this.hiddenAccounts.show(hiddenAvailable && state.accounts.showHidden);
    }

    /** Renders list item of totals widget */
    renderTotalsListItem(item) {
        const { currency } = App.model;
        return createElement('li', {
            props: {
                className: 'total-list__item',
                textContent: currency.formatCurrency(item.balance, item.curr_id),
            },
        });
    }

    /** Renders totals widget */
    renderTotalsWidget() {
        const { userAccounts } = App.model;
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
            const precision = getCurrencyPrecision(account.curr_id);
            item.balance = normalize(item.balance + account.balance, precision);
        });

        const elems = Object.values(totals).map((item) => this.renderTotalsListItem(item));
        removeChilds(this.totalList);
        this.totalList.append(...elems);
    }

    /** Renders persons widget */
    renderPersonsWidget(state, prevState) {
        if (
            state.persons.visible === prevState?.persons?.visible
            && state.persons.hidden === prevState?.persons?.hidden
            && state.persons.showHidden === prevState?.persons?.showHidden
            && state.renderTime === prevState?.renderTime
        ) {
            return;
        }

        this.visiblePersons.setState((listState) => ({
            ...listState,
            items: listData(state.persons.visible),
            renderTime: state.renderTime,
        }));

        const hiddenAvailable = state.persons.hidden.length > 0;

        show(this.togglePersonsBtn, hiddenAvailable);
        this.togglePersonsBtn.textContent = (state.persons.showHidden)
            ? __('actions.showVisible')
            : __('actions.showAll');

        this.hiddenPersons.setState((listState) => ({
            ...listState,
            items: listData(state.persons.hidden),
            renderTime: state.renderTime,
        }));
        this.hiddenPersons.show(hiddenAvailable && state.persons.showHidden);
    }

    /** Renders transaction context menu */
    renderTransactionContextMenu(state, prevState) {
        if (
            state.transactionContextItem === prevState?.transactionContextItem
            && state.showContextMenu === prevState?.showContextMenu
        ) {
            return;
        }

        if (!state.showContextMenu && !this.transactionContextMenu) {
            return;
        }

        if (!this.transactionContextMenu) {
            this.transactionContextMenu = TransactionListContextMenu.create({
                id: 'contextMenu',
                onItemClick: (item) => this.onContextMenuClick(item),
                onClose: () => this.hideContextMenu(),
            });
        }

        this.transactionContextMenu.setContext({
            showContextMenu: state.showContextMenu,
            contextItem: state.transactionContextItem,
            showDetailsItem: false,
        });
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
    renderStatisticsWidget(state, prevState) {
        if (state.chartData === prevState?.chartData) {
            return;
        }

        const [value] = state.chartData?.values ?? [];
        const dataSet = value?.data ?? [];
        const noData = !dataSet.length && !state.chartData?.series?.length;

        show(this.statNoDataMessage, state.chartData && noData);
        show(this.histogram?.chartContainer, !noData);

        const data = (noData)
            ? { values: [], series: [] }
            : state.chartData;

        this.histogram?.setData(data);
    }

    /** Renders 'Set transaction category' dialog */
    renderCategoryDialog(state, prevState) {
        if (state.categoryDialog === prevState?.categoryDialog) {
            return;
        }

        if (state.categoryDialog.show && !this.setCategoryDialog) {
            this.setCategoryDialog = SetCategoryDialog.create({
                onChange: (category) => this.onChangeCategorySelect(category),
                onSubmit: () => this.setItemsCategory(),
                onCancel: () => this.closeCategoryDialog(),
            });
        }
        if (!this.setCategoryDialog) {
            return;
        }

        this.setCategoryDialog.setState((dialogState) => ({
            ...dialogState,
            categoryId: state.categoryDialog.categoryId,
            type: state.categoryDialog.type,
        }));
        this.setCategoryDialog.show(state.categoryDialog.show);
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

App.createView(MainView);
