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
import { PopupMenu } from 'jezvejs/PopupMenu';
import { createStore } from 'jezvejs/Store';
import { TabList } from 'jezvejs/TabList';
import { API } from '../../js/api/index.js';
import {
    formatPersonDebts,
    formatValueShort,
    listData,
    normalize,
    __,
} from '../../js/utils.js';
import { SetCategoryDialog } from '../../Components/SetCategoryDialog/SetCategoryDialog.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { IconList } from '../../js/model/IconList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { Tile } from '../../Components/Tile/Tile.js';
import { AccountTile } from '../../Components/AccountTile/AccountTile.js';
import { TransactionList } from '../../Components/TransactionList/TransactionList.js';
import { reducer, actions } from './reducer.js';
import './MainView.scss';

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
        window.app.initCategoriesModel();
        window.app.loadModel(IconList, 'icons', window.app.props.icons);

        const initialState = {
            transactions: [...this.props.transactions],
            accounts: {
                visible: AccountList.create(window.app.model.visibleUserAccounts),
                hidden: AccountList.create(window.app.model.hiddenUserAccounts),
                showHidden: false,
            },
            persons: {
                visible: PersonList.create(window.app.model.visiblePersons),
                hidden: PersonList.create(window.app.model.hiddenPersons),
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
        const { baseURL } = window.app;
        const state = this.store.getState();

        this.loadElementsByIds([
            'contentContainer',
            'summaryWidget',
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
            noItemsMessage: () => this.renderAccountsNoData(),
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
            noItemsMessage: () => this.renderPersonsNoData(),
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
                title: __('ACCOUNTS'),
                content: [
                    this.visibleAccounts.elem,
                    this.hiddenAccounts.elem,
                    this.toggleAccountsBtn,
                ],
            }, {
                id: 'persons',
                value: 'persons',
                title: __('PERSONS'),
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

    createToggleShowAllButton(props = {}) {
        const events = {};
        if (isFunction(props?.onClick)) {
            events.click = props.onClick;
        }

        return createElement('button', {
            props: {
                className: 'btn link-btn',
                type: 'button',
                textContent: __('SHOW_ALL'),
            },
            events,
        });
    }

    /** Creates context menu for latest transactions list */
    createTransactionContextMenu() {
        this.transactionContextMenu = PopupMenu.create({
            id: 'contextMenu',
            fixed: false,
            onItemClick: () => this.hideContextMenu(),
            onClose: () => this.hideContextMenu(),
            items: [{
                id: 'ctxUpdateBtn',
                type: 'link',
                icon: 'update',
                title: __('UPDATE'),
            }, {
                id: 'ctxSetCategoryBtn',
                title: __('SET_CATEGORY'),
                onClick: () => this.showCategoryDialog(),
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
            window.app.createErrorNotification(e.message);
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
            window.app.createErrorNotification(e.message);
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
            window.app.createErrorNotification(e.message);
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
            onConfirm: () => this.deleteItems(),
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
            ? __('SHOW_VISIBLE')
            : __('SHOW_ALL');

        this.hiddenAccounts.setState((listState) => ({
            ...listState,
            items: listData(state.accounts.hidden),
            renderTime: state.renderTime,
        }));
        this.hiddenAccounts.show(hiddenAvailable && state.accounts.showHidden);
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
            ? __('SHOW_VISIBLE')
            : __('SHOW_ALL');

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

        const itemId = state.transactionContextItem;
        if (!itemId || !state.showContextMenu) {
            this.transactionContextMenu.detach();
            return;
        }
        const listItem = this.latestList.getListItemById(itemId);
        const menuButton = listItem?.elem?.querySelector('.menu-btn');
        if (!menuButton) {
            this.transactionContextMenu.detach();
            return;
        }

        const { baseURL } = window.app;
        const { items } = this.transactionContextMenu;
        items.ctxUpdateBtn.setURL(`${baseURL}transactions/update/${itemId}`);

        this.transactionContextMenu.attachAndShow(menuButton);
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

        this.histogram?.setData(state.chartData);
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

window.app = new Application(window.appProps);
window.app.createView(MainView);
