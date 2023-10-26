import 'jezvejs/style';
import {
    show,
    createElement,
    removeChilds,
} from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { Histogram } from 'jezvejs/Histogram';
import { ListContainer } from 'jezvejs/ListContainer';
import { createStore } from 'jezvejs/Store';
import { TabList } from 'jezvejs/TabList';

// Application
import { normalize } from '../../utils/decimal.js';
import {
    formatNumberShort,
    formatPersonDebts,
    getCurrencyPrecision,
    __,
    getApplicationURL,
} from '../../utils/utils.js';
import {
    formatDateLabel,
    formatValue,
    isStackedData,
} from '../../utils/statistics.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { IconList } from '../../Models/IconList.js';

// Common components
import { AccountTile } from '../../Components/Common/AccountTile/AccountTile.js';
import { ChartPopup } from '../../Components/Common/ChartPopup/ChartPopup.js';
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { Tile } from '../../Components/Common/Tile/Tile.js';
import { NoDataMessage } from '../../Components/Common/NoDataMessage/NoDataMessage.js';
import { SetCategoryDialog } from '../../Components/Category/SetCategoryDialog/SetCategoryDialog.js';
import { TransactionList } from '../../Components/Transaction/TransactionList/TransactionList.js';
import { TransactionListContextMenu } from '../../Components/Transaction/TransactionListContextMenu/TransactionListContextMenu.js';

// Local components
import { Widget } from './components/Widget/Widget.js';
import { NoDataGroup } from './components/NoDataGroup/NoDataGroup.js';

import { reducer, actions } from './reducer.js';
import { setItemsCategory, deleteItems } from './actions.js';
import { getTransactionListContextIds } from './helpers.js';
import './MainView.scss';

/**
 * Main view
 */
class MainView extends AppView {
    constructor(...args) {
        super(...args);

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
            categoryDialog: {
                show: false,
                categoryId: 0,
                type: 0,
            },
            statistics: {
                ...this.props.statistics,
            },
            loading: true,
            showContextMenu: false,
            showDeleteConfirmDialog: false,
            transactionContextItem: null,
            renderTime: Date.now(),
        };

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const state = this.store.getState();

        this.loadElementsByIds([
            'contentContainer',
        ]);

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create();
        this.contentContainer.append(this.loadingIndicator.elem);
        this.loadingIndicator.show(state.loading);

        this.createSummaryWidget();
        this.createTotalsWidget();
        this.createTransactionsWidget();
        this.createStatisticsWidget();

        this.subscribeToStore(this.store);
        this.stopLoading();
    }

    get isTransactionsAvailable() {
        return (
            App.model.userAccounts.length > 0
            || App.model.persons.length > 0
        );
    }

    createSummaryWidget() {
        const state = this.store.getState();

        // Accounts tab
        const accountsProps = {
            ItemComponent: AccountTile,
            getItemProps: (account, { listMode }) => ({
                type: 'link',
                link: getApplicationURL(`transactions/create/?acc_id=${account.id}`),
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
                url: getApplicationURL('accounts/create/'),
            }),
        };

        this.visibleAccounts = ListContainer.create({
            ...accountsProps,
            items: state.accounts.visible,
        });

        this.hiddenAccounts = ListContainer.create({
            ...accountsProps,
            items: state.accounts.hidden,
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
                link: getApplicationURL(`transactions/create/?type=debt&person_id=${person.id}`),
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
                url: getApplicationURL('persons/create/'),
            }),
        };

        this.visiblePersons = ListContainer.create({
            ...personProps,
            items: state.persons.visible,
        });

        this.hiddenPersons = ListContainer.create({
            ...personProps,
            items: state.persons.hidden,
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
                    this.toggleAccountsBtn.elem,
                ],
            }, {
                id: 'persons',
                value: 'persons',
                title: __('persons.listTitle'),
                content: [
                    this.visiblePersons.elem,
                    this.hiddenPersons.elem,
                    this.togglePersonsBtn.elem,
                ],
            }],
        });

        this.summaryWidget = Widget.create({
            id: 'summaryWidget',
            className: 'summary-widget',
            content: this.summaryTabs.elem,
        });

        this.contentContainer.append(this.summaryWidget.elem);
    }

    createTotalsWidget() {
        if (App.model.userAccounts.length === 0) {
            return;
        }

        this.totalList = createElement('ul', {
            props: { className: 'total-list' },
        });

        this.totalWidget = Widget.create({
            id: 'totalWidget',
            className: 'total-widget',
            header: __('main.total'),
            content: this.totalList,
        });
        this.contentContainer.append(this.totalWidget.elem);
    }

    createTransactionsWidget() {
        if (!this.isTransactionsAvailable) {
            return;
        }

        this.latestList = TransactionList.create({
            items: this.props.transactions,
            listMode: 'list',
            showControls: true,
            getPlaceholderProps: () => ({ title: __('main.noTransactions') }),
            onItemClick: (id, e) => this.onTransactionClick(id, e),
        });

        this.transactionsWidget = Widget.create({
            id: 'transactionsWidget',
            className: 'transactions-widget',
            header: __('transactions.listTitle'),
            headerLink: 'transactions/',
            content: this.latestList.elem,
        });

        this.contentContainer.append(this.transactionsWidget.elem);
    }

    createStatisticsWidget() {
        if (!this.isTransactionsAvailable) {
            return;
        }

        this.histogram = Histogram.create({
            data: this.props.statistics.chartData,
            height: 200,
            fitToWidth: true,
            showPopupOnHover: true,
            showPopupOnClick: true,
            animatePopup: true,
            activateOnClick: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
            renderXAxisLabel: (value) => App.formatDate(value),
            renderYAxisLabel: (value) => formatNumberShort(value),
        });

        this.statNoDataMessage = NoDataMessage.create({
            title: __('statistics.noData'),
        });

        const chart = createElement('div', {
            props: {
                id: 'chart',
                className: 'widget_charts',
            },
            children: [
                this.statNoDataMessage.elem,
                this.histogram.elem,
            ],
        });

        this.statisticsWidget = Widget.create({
            id: 'statisticsWidget',
            className: 'statistics-widget',
            header: __('statistics.title'),
            headerLink: 'statistics/',
            content: chart,
        });

        this.contentContainer.append(this.statisticsWidget.elem);
    }

    createToggleShowAllButton(props = {}) {
        return Button.create({
            className: 'link-btn',
            type: 'button',
            title: __('actions.showAll'),
            ...props,
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

    renderDeleteConfirmDialog(state, prevState) {
        if (state.showDeleteConfirmDialog === prevState.showDeleteConfirmDialog) {
            return;
        }

        if (!state.showDeleteConfirmDialog) {
            return;
        }

        const ids = getTransactionListContextIds(state);
        if (ids.length === 0) {
            return;
        }

        const multiple = (ids.length > 1);
        ConfirmDialog.create({
            id: 'delete_warning',
            title: (multiple) ? __('transactions.deleteMultiple') : __('transactions.delete'),
            content: (multiple) ? __('transactions.deleteMultipleMessage') : __('transactions.deleteMessage'),
            onConfirm: () => this.store.dispatch(deleteItems()),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    /** Renders summary widget */
    renderSummaryWidget(state, prevState) {
        this.renderAccountsTab(state, prevState);
        this.renderPersonsTab(state, prevState);
    }

    /** Renders accounts tab at summary widget */
    renderAccountsTab(state, prevState) {
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
            items: state.accounts.visible,
            renderTime: state.renderTime,
        }));

        const hiddenAvailable = state.accounts.hidden.length > 0;

        this.toggleAccountsBtn.show(hiddenAvailable);
        this.toggleAccountsBtn.setTitle(
            (state.accounts.showHidden)
                ? __('actions.showVisible')
                : __('actions.showAll'),
        );

        this.hiddenAccounts.setState((listState) => ({
            ...listState,
            items: state.accounts.hidden,
            renderTime: state.renderTime,
        }));
        this.hiddenAccounts.show(hiddenAvailable && state.accounts.showHidden);
    }

    /** Renders persons widget */
    renderPersonsTab(state, prevState) {
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
            items: state.persons.visible,
            renderTime: state.renderTime,
        }));

        const hiddenAvailable = state.persons.hidden.length > 0;

        this.togglePersonsBtn.show(hiddenAvailable);
        this.togglePersonsBtn.setTitle(
            (state.persons.showHidden)
                ? __('actions.showVisible')
                : __('actions.showAll'),
        );

        this.hiddenPersons.setState((listState) => ({
            ...listState,
            items: state.persons.hidden,
            renderTime: state.renderTime,
        }));
        this.hiddenPersons.show(hiddenAvailable && state.persons.showHidden);
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

        this.totalWidget?.show(!noAccounts);
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
                actions,
                dispatch: (action) => this.store.dispatch(action),
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
        if (
            !this.isTransactionsAvailable
            || state.transactions.length === 0
        ) {
            return;
        }

        this.renderTransactionContextMenu(state, prevState);

        this.latestList.setState((listState) => ({
            ...listState,
            items: state.transactions,
            renderTime: state.renderTime,
        }));
    }

    /** Returns content of chart popup for specified target */
    renderPopupContent(target) {
        const { statistics } = this.store.getState();
        return ChartPopup.fromTarget(target, {
            formatValue: (value) => formatValue(value, statistics),
            renderDateLabel: (value) => formatDateLabel(value, statistics),
        });
    }

    /** Renders statistics widget */
    renderStatisticsWidget(state, prevState) {
        const { chartData, filter } = state.statistics;
        if (
            !this.isTransactionsAvailable
            || chartData === prevState?.statistics?.chartData
        ) {
            return;
        }

        const [value] = chartData?.values ?? [];
        const dataSet = value?.data ?? [];
        const noData = !dataSet.length && !chartData?.series?.length;

        this.statNoDataMessage?.show(chartData && noData);
        show(this.histogram?.chartContainer, !noData);

        const data = (noData)
            ? { values: [], series: [] }
            : chartData;
        data.stacked = isStackedData(filter);

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
                onSubmit: () => this.store.dispatch(setItemsCategory()),
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

        this.renderSummaryWidget(state, prevState);
        this.renderTotalsWidget(state, prevState);
        this.renderTransactionsWidget(state, prevState);
        this.renderStatisticsWidget(state, prevState);

        this.renderCategoryDialog(state, prevState);
        this.renderDeleteConfirmDialog(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(MainView);
