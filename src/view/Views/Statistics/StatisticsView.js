import 'jezvejs/style';
import {
    createElement,
    getClassName,
    setEvents,
    show,
    asArray,
} from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { DropDown } from 'jezvejs/DropDown';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { Button } from 'jezvejs/Button';
import { PieChart } from 'jezvejs/PieChart';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { formatValueShort, normalize, __ } from '../../js/utils.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { Transaction } from '../../js/model/Transaction.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { createStore } from '../../js/store.js';
import {
    getGroupTypeByName,
    isSameSelection,
    actions,
    reducer,
} from './reducer.js';
import './style.scss';

/** CSS classes */
/* Chart popup */
const POPUP_CONTENT_CLASS = 'chart-popup__content';
const POPUP_HEADER_CLASS = 'chart-popup__header';
const POPUP_SERIES_CLASS = 'chart-popup__series';
const POPUP_LIST_CLASS = 'chart-popup-list';
const POPUP_LIST_ITEM_CLASS = 'chart-popup-list__item';
const POPUP_LIST_ITEM_CATEGORY_CLASS = 'chart-popup-list__item-cat-';
const POPUP_LIST_VALUE_CLASS = 'chart-popup-list__value';
/* Chart legend */
const LEGEND_LIST_CLASS = 'chart__legend-list';
const LEGEND_ITEM_CAT_CLASS = 'chart-legend__item-cat-';
const LEGEND_ITEM_TITLE_CLASS = 'chart-legend__item-title';

const defaultProps = {
    filter: {},
};

/**
 * Statistics view
 */
class StatisticsView extends View {
    constructor(...args) {
        super(...args);

        if (!('accountCurrency' in this.props)) {
            throw new Error('Invalid Statistics view properties');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        const initialState = {
            accountCurrency: this.props.accountCurrency,
            chartData: null,
            selectedColumn: null,
            pieChartInfo: null,
            selectedPieChartItem: null,
            filter: { ...this.props.filter },
            form: { ...this.props.filter },
            loading: false,
            renderTime: Date.now(),
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.checkUserAccountModels();
        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'heading',
            'contentHeader',
            // Filters
            'filtersContainer',
            'applyFiltersBtn',
            'typeMenu',
            'reportMenu',
            'accountsFilter',
            'categoriesFilter',
            'currencyFilter',
            'dateFilter',
            // Histogram
            'chart',
            // Pie chart
            'pieChartHeaderType',
            'pieChartHeaderDate',
            'pieChartTotal',
            'pieChartTotalValue',
            'pieChartContainer',
            'pieChartInfo',
            'pieChartInfoTitle',
            'pieChartInfoPercent',
            'pieChartInfoValue',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('STATISTICS'),
        });

        // Filters
        this.filtersBtn = Button.create({
            id: 'filtersBtn',
            className: 'circle-btn',
            icon: 'filter',
            onClick: () => this.filters.toggle(),
        });
        this.heading.actionsContainer.prepend(this.filtersBtn.elem);

        this.filters = FiltersContainer.create({
            content: this.filtersContainer,
        });
        this.contentHeader.prepend(this.filters.elem);

        setEvents(this.applyFiltersBtn, { click: () => this.filters.close() });

        // Transaction type filter
        this.typeMenu = TransactionTypeMenu.fromElement(this.typeMenu, {
            multiple: true,
            allowActiveLink: true,
            itemParam: 'type',
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        // Report type filter
        this.reportMenu = LinkMenu.fromElement(this.reportMenu, {
            itemParam: 'report',
            onChange: (value) => this.onSelectReportType(value),
        });

        // Currency filter
        this.currencyDropDown = DropDown.create({
            elem: 'curr_id',
            onItemSelect: (obj) => this.onCurrencySel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initCurrencyList(this.currencyDropDown);

        // Accounts filter
        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            multiple: true,
            placeholder: __('TYPE_TO_FILTER'),
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onItemSelect: (obj) => this.onAccountSel(obj),
            onChange: (obj) => this.onAccountSel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initAccountsList(this.accountDropDown);

        // Categories filter
        this.categoryDropDown = CategorySelect.create({
            elem: 'category_id',
            multiple: true,
            placeholder: __('TYPE_TO_FILTER'),
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onItemSelect: (obj) => this.onCategorySel(obj),
            onChange: (obj) => this.onCategorySel(obj),
            className: 'dd_fullwidth',
        });

        // 'Group by' filter
        this.groupDropDown = DropDown.create({
            elem: 'groupsel',
            onItemSelect: (obj) => this.onGroupSel(obj),
            className: 'dd_fullwidth',
        });

        // Date range filter
        this.dateRangeFilter = DateRangeInput.create({
            id: 'dateFrm',
            startPlaceholder: __('DATE_RANGE_FROM'),
            endPlaceholder: __('DATE_RANGE_TO'),
            onChange: (data) => this.onChangeDateFilter(data),
        });
        this.dateFilter.append(this.dateRangeFilter.elem);

        // Chart
        this.noDataMessage = this.chart.querySelector('.nodata-message');
        this.histogram = Histogram.create({
            height: 320,
            marginTop: 35,
            scrollToEnd: true,
            autoScale: true,
            animate: true,
            barWidth: 45,
            columnGap: 3,
            showPopupOnHover: true,
            animatePopup: true,
            activateOnClick: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
            showLegend: true,
            renderLegend: (data) => this.renderLegendContent(data),
            renderYAxisLabel: (value) => formatValueShort(value),
            onItemClick: (target) => this.onSelectDataColumn(target),
        });
        this.chart.append(this.histogram.elem);

        // Pie chart
        this.pieChart = PieChart.create({
            data: null,
            radius: 150,
            innerRadius: 120,
            offset: 10,
            onItemOver: (item) => this.onPieChartItemOver(item),
            onItemOut: (item) => this.onPieChartItemOut(item),
            onItemClick: (item) => this.onPieChartItemClick(item),
        });
        this.pieChartContainer.append(this.pieChart.elem);

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });
        this.chart.append(this.loadingIndicator.elem);

        this.subscribeToStore(this.store);
        this.onPostInit();
    }

    onPostInit() {
        const state = this.store.getState();

        // Select first account if nothing selected on account report type
        const accounts = asArray(state.form.acc_id);
        if (state.form.report === 'account' && accounts.length === 0) {
            const account = window.app.model.userAccounts.getItemByIndex(0);
            this.store.dispatch(actions.changeAccountsFilter([account.id]));
        }

        const { form } = this.store.getState();
        this.requestData(form);
    }

    /** Set loading state and render view */
    startLoading() {
        this.store.dispatch(actions.startLoading());
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.store.dispatch(actions.stopLoading());
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state) {
        const { baseURL } = window.app;
        const { filter } = state;
        const res = new URL(`${baseURL}statistics/`);

        Object.keys(filter).forEach((prop) => {
            const value = filter[prop];
            if (Array.isArray(value)) {
                const arrProp = `${prop}[]`;
                value.forEach((item) => res.searchParams.append(arrProp, item));
            } else {
                res.searchParams.set(prop, value);
            }
        });

        return res;
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.store.dispatch(actions.changeTypeFilter(selected));
        const state = this.store.getState();
        this.requestData(state.form);
    }

    /** Date range filter change handler */
    onChangeDateFilter(data) {
        this.store.dispatch(actions.changeDateFilter(data));
        const state = this.store.getState();
        this.requestData(state.form);
    }

    /**
     * Report type select callback
     * @param {string} value - selected report type
     */
    onSelectReportType(value) {
        this.store.dispatch(actions.changeReportType(value));
        const state = this.store.getState();
        this.requestData(state.form);
    }

    /**
     * Account select callback
     * @param {object} accounts - selected accounts
     */
    onAccountSel(accounts) {
        const ids = asArray(accounts).map((item) => parseInt(item.id, 10));
        const state = this.store.getState();
        const filterIds = state.form.acc_id ?? [];
        if (isSameSelection(ids, filterIds)) {
            return;
        }

        this.store.dispatch(actions.changeAccountsFilter(ids));
        const { form } = this.store.getState();
        this.requestData(form);
    }

    /**
     * Categories select callback
     * @param {object} categories - selected categories
     */
    onCategorySel(categories) {
        const ids = asArray(categories).map((item) => parseInt(item.id, 10));
        const state = this.store.getState();
        const filterIds = state.form.category_id ?? [];
        if (isSameSelection(ids, filterIds)) {
            return;
        }

        this.store.dispatch(actions.changeCategoriesFilter(ids));
        const { form } = this.store.getState();
        this.requestData(form);
    }

    /**
     * Currency select callback
     * @param {object} obj - selected currency item
     */
    onCurrencySel(obj) {
        if (!obj) {
            return;
        }

        this.store.dispatch(actions.changeCurrencyFilter(obj.id));
        const { form } = this.store.getState();
        this.requestData(form);
    }

    /**
     * Group select callback
     * @param {object} obj - selected group item
     */
    onGroupSel(obj) {
        if (!obj) {
            return;
        }

        this.store.dispatch(actions.changeGroupType(obj.id));
        const { form } = this.store.getState();
        this.requestData(form);
    }

    /** Histogram item 'click' event handler */
    onSelectDataColumn(target) {
        this.store.dispatch(actions.selectDataColumn(target));
    }

    /** Pie chart item 'mouseover' event handler */
    onPieChartItemOver(item) {
        this.store.dispatch(actions.showPieChartInfo(item));
    }

    /** Pie chart item 'mouseout' event handler */
    onPieChartItemOut(item) {
        this.store.dispatch(actions.hidePieChartInfo(item));
    }

    /** Pie chart item 'click' event handler */
    onPieChartItemClick(item) {
        this.store.dispatch(actions.selectPieChartItem(item));
    }

    replaceHistory(state) {
        const url = this.getFilterURL(state);
        const pageTitle = `${__('APP_NAME')} | ${__('STATISTICS')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    async requestData(options) {
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;
        let aborted = false;

        this.startLoading();

        try {
            const result = await API.transaction.statistics(options, { signal });
            this.store.dispatch(actions.dataRequestLoaded(result.data));
        } catch (e) {
            aborted = e.name === 'AbortError';
            if (!aborted) {
                window.app.createErrorNotification(e.message);
                this.store.dispatch(actions.dataRequestError());
            }
        }

        if (!aborted) {
            this.stopLoading();
            this.store.dispatch(actions.setRenderTime());
        }
    }

    formatValue(value) {
        const state = this.store.getState();
        return window.app.model.currency.formatCurrency(
            value,
            state.accountCurrency,
        );
    }

    formatPercent(value) {
        return `${normalize(value)} %`;
    }

    renderPopupListItem(item) {
        const categoryClass = `${POPUP_LIST_ITEM_CATEGORY_CLASS}${item.categoryIndex + 1}`;
        return createElement('li', {
            props: { className: getClassName(POPUP_LIST_ITEM_CLASS, categoryClass) },
            children: createElement('span', {
                props: {
                    className: POPUP_LIST_VALUE_CLASS,
                    textContent: this.formatValue(item.value),
                },
            }),
        });
    }

    /** Returns content of chart popup for specified target */
    renderPopupContent(target) {
        if (!target) {
            return null;
        }

        const items = target.group ?? [target.item];
        const listItems = [];
        items.forEach((item) => {
            if (
                item.columnIndex !== target.item.columnIndex
                || item.value === 0
            ) {
                return;
            }

            listItems.push(this.renderPopupListItem(item));
        });

        if (listItems.length === 0) {
            return null;
        }

        const list = createElement('ul', {
            props: { className: POPUP_LIST_CLASS },
            children: listItems,
        });
        const headerTitle = Transaction.getTypeTitle(target.item.groupName);
        const header = createElement('div', {
            props: { className: POPUP_HEADER_CLASS, textContent: headerTitle },
        });
        const series = createElement('div', {
            props: { className: POPUP_SERIES_CLASS, textContent: target.series },
        });

        return createElement('div', {
            props: { className: POPUP_CONTENT_CLASS },
            children: [header, series, list],
        });
    }

    isStackedData(filter) {
        const { report } = filter;
        return (
            report === 'category'
            || (report === 'account' && filter.acc_id?.length > 1)
        );
    }

    getDataCategoryName(value) {
        const categoryId = parseInt(value, 10);
        const state = this.store.getState();
        const isStacked = this.isStackedData(state.filter);
        if (!isStacked) {
            const selectedTypes = asArray(state.form.type);
            return Transaction.getTypeTitle(selectedTypes[categoryId]);
        }

        if (state.filter.report === 'account') {
            const account = window.app.model.userAccounts.getItem(categoryId);
            return account.name;
        }

        if (state.filter.report === 'category') {
            if (categoryId === 0) {
                return __('NO_CATEGORY');
            }

            const category = window.app.model.categories.getItem(categoryId);
            return category.name;
        }

        throw new Error('Invalid state');
    }

    renderLegendContent(categories) {
        if (!Array.isArray(categories) || categories.length === 0) {
            return null;
        }

        return createElement('ul', {
            props: { className: LEGEND_LIST_CLASS },
            children: categories.map((category, index) => createElement('li', {
                props: {
                    className: `${LEGEND_ITEM_CAT_CLASS}${index + 1}`,
                },
                children: createElement('span', {
                    props: {
                        className: LEGEND_ITEM_TITLE_CLASS,
                        textContent: this.getDataCategoryName(category),
                    },
                }),
            })),
        });
    }

    renderAccountsFilter(state) {
        const ids = state.form?.acc_id ?? [];
        const selection = [];

        window.app.model.userAccounts.forEach((account) => {
            const enable = (
                state.accountCurrency === 0
                || ids.length === 0
                || account.curr_id === state.accountCurrency
            );
            this.accountDropDown.enableItem(account.id, enable);

            if (enable && ids.includes(account.id)) {
                selection.push(account.id);
            }
        });

        this.accountDropDown.setSelection(selection);
    }

    renderCategoriesFilter(state) {
        const ids = state.form?.category_id ?? [];
        this.categoryDropDown.setSelection(ids);
    }

    renderFilters(state, prevState = {}) {
        if (state.form === prevState.form) {
            return;
        }

        if (state.filter !== prevState.filter) {
            this.replaceHistory(state);
        }

        const filterUrl = this.getFilterURL(state);

        this.typeMenu.setURL(filterUrl);
        this.typeMenu.setSelection(state.form.type);

        const { report } = state.form;
        this.reportMenu.setActive(report);

        show(this.accountsFilter, (report === 'account'));
        show(this.categoriesFilter, (report === 'category'));
        show(this.currencyFilter, (report === 'currency'));

        this.renderAccountsFilter(state);
        this.renderCategoriesFilter(state);

        if (state.form.curr_id) {
            this.currencyDropDown.setSelection(state.form.curr_id);
        }

        const groupType = getGroupTypeByName(state.form.group);
        this.groupDropDown.setSelection(groupType);

        // Render date
        const dateFilter = {
            stdate: (state.form.stdate ?? null),
            enddate: (state.form.enddate ?? null),
        };
        this.dateRangeFilter.setData(dateFilter);
    }

    renderHistogram(state, prevState = {}) {
        if (state.chartData === prevState.chartData) {
            return;
        }

        const [value] = state.chartData?.values ?? [];
        const dataSet = value?.data ?? [];
        const noData = !dataSet.length && !state.chartData?.series?.length;
        show(this.noDataMessage, state.chartData && noData);
        show(this.histogram.chartContainer, !noData);

        const data = (noData)
            ? { values: [], series: [] }
            : state.chartData;
        data.stacked = this.isStackedData(state.filter);

        this.histogram.setData(data);
    }

    renderPieChart(state) {
        if (!state.selectedColumn) {
            this.pieChart.hide();
            return;
        }

        this.pieChart.setData(state.selectedColumn.items);
        this.pieChart.show();
    }

    renderPieChartHeader(state, prevState = {}) {
        if (state.selectedColumn === prevState?.selectedColumn) {
            return;
        }

        if (!state.selectedColumn) {
            this.pieChartHeaderType.textContent = null;
            this.pieChartHeaderDate.textContent = null;
            show(this.pieChartTotal, false);
            return;
        }

        const { groupName, series, total } = state.selectedColumn;
        this.pieChartHeaderType.textContent = Transaction.getTypeTitle(groupName);
        this.pieChartHeaderDate.textContent = series;

        this.pieChartTotalValue.textContent = this.formatValue(total);
        show(this.pieChartTotal, true);
    }

    renderPieChartInfo(state, prevState = {}) {
        if (state.pieChartInfo === prevState?.pieChartInfo) {
            return;
        }

        if (!state.pieChartInfo) {
            this.pieChartInfoTitle.textContent = null;
            this.pieChartInfoPercent.textContent = null;
            this.pieChartInfoValue.textContent = null;
            show(this.pieChartInfo, false);
            return;
        }

        const { categoryId, value } = state.pieChartInfo;
        const { total } = state.selectedColumn;

        this.pieChartInfoTitle.textContent = this.getDataCategoryName(categoryId);
        this.pieChartInfoPercent.textContent = this.formatPercent((value / total) * 100);
        this.pieChartInfoValue.textContent = this.formatValue(value);

        show(this.pieChartInfo, true);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        this.renderFilters(state, prevState);
        this.renderHistogram(state, prevState);
        this.renderPieChart(state, prevState);
        this.renderPieChartHeader(state, prevState);
        this.renderPieChartInfo(state, prevState);

        this.histogram.elem.dataset.time = state.renderTime;

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(StatisticsView);
