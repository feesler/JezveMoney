import 'jezvejs/style';
import {
    createElement,
    setEvents,
    insertAfter,
    show,
    asArray,
} from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { DropDown } from 'jezvejs/DropDown';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { IconButton } from 'jezvejs/IconButton';
import { PieChart } from 'jezvejs/PieChart';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { formatValueShort } from '../../js/utils.js';
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

/** Strings */
const STR_TITLE = 'Statistics';
const PAGE_TITLE = 'Jezve Money | Statistics';
const TITLE_NO_CATEGORY = 'No category';
/* Date range input */
const START_DATE_PLACEHOLDER = 'From';
const END_DATE_PLACEHOLDER = 'To';

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
            pieChartData: null,
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
            // Filters
            'filtersBtn',
            'filtersContainer',
            'applyFiltersBtn',
            'typeMenu',
            'reportMenu',
            'accountsFilter',
            'categoriesFilter',
            'currencyFilter',
            'dateFrm',
            // Chart
            'chart',
            'pieChartContainer',
            'pieChartInfo',
            'pieChartInfoTitle',
            'pieChartInfoValue',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: STR_TITLE,
        });

        // Filters
        this.filtersBtn = IconButton.fromElement(this.filtersBtn, {
            onClick: () => this.filters.toggle(),
        });
        this.filters = FiltersContainer.create({
            content: this.filtersContainer,
        });
        insertAfter(this.filters.elem, this.filtersBtn.elem);

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
            onitemselect: (obj) => this.onCurrencySel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initCurrencyList(this.currencyDropDown);

        // Accounts filter
        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            multiple: true,
            placeholder: 'Type to filter accounts',
            enableFilter: true,
            noResultsMessage: 'Nothing found',
            onitemselect: (obj) => this.onAccountSel(obj),
            onchange: (obj) => this.onAccountSel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initAccountsList(this.accountDropDown);

        // Categories filter
        this.categoryDropDown = CategorySelect.create({
            elem: 'category_id',
            multiple: true,
            placeholder: 'Type to filter categories',
            enableFilter: true,
            noResultsMessage: 'Nothing found',
            onitemselect: (obj) => this.onCategorySel(obj),
            onchange: (obj) => this.onCategorySel(obj),
            className: 'dd_fullwidth',
        });

        // 'Group by' filter
        this.groupDropDown = DropDown.create({
            elem: 'groupsel',
            onitemselect: (obj) => this.onGroupSel(obj),
            className: 'dd_fullwidth',
        });

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(this.dateFrm, {
            startPlaceholder: START_DATE_PLACEHOLDER,
            endPlaceholder: END_DATE_PLACEHOLDER,
            onChange: (data) => this.onChangeDateFilter(data),
        });

        // Chart
        this.noDataMessage = this.chart.querySelector('.nodata-message');
        this.histogram = Histogram.create({
            elem: this.chart,
            height: 320,
            marginTop: 35,
            scrollToEnd: true,
            autoScale: true,
            animate: true,
            barWidth: 45,
            columnGap: 3,
            showPopup: true,
            showPopupOnHover: true,
            animatePopup: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
            showLegend: true,
            renderLegend: (data) => this.renderLegendContent(data),
            renderYAxisLabel: (value) => formatValueShort(value),
            onitemclick: (target) => this.onSelectDataColumn(target),
        });

        // Pie chart
        this.pieChart = PieChart.create({
            data: null,
            radius: 100,
            innerRadius: 70,
            offset: 10,
            onitemover: (item) => this.onPieChartItemOver(item),
            onitemout: (item) => this.onPieChartItemOut(item),
            onitemclick: (item) => this.onPieChartItemClick(item),
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
        window.history.replaceState({}, PAGE_TITLE, url);
    }

    async requestData(options) {
        this.startLoading();

        try {
            const result = await API.transaction.statistics(options);
            this.store.dispatch(actions.dataRequestLoaded(result.data));
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');
            this.store.dispatch(actions.dataRequestError());
        }

        this.stopLoading();
    }

    formatValue(value) {
        const state = this.store.getState();
        return window.app.model.currency.formatCurrency(
            value,
            state.accountCurrency,
        );
    }

    renderPopupListItem(item) {
        const categoryClass = `${POPUP_LIST_ITEM_CATEGORY_CLASS}${item.categoryIndex + 1}`;
        return createElement('li', {
            props: { className: [POPUP_LIST_ITEM_CLASS, categoryClass].join(' ') },
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
                return TITLE_NO_CATEGORY;
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
        window.app.model.userAccounts.forEach((account) => {
            const enable = (
                state.accountCurrency === 0
                || account.curr_id === state.accountCurrency
            );
            this.accountDropDown.enableItem(account.id, enable);

            if (enable && ids.includes(account.id)) {
                this.accountDropDown.selectItem(account.id);
            } else {
                this.accountDropDown.deselectItem(account.id);
            }
        });
    }

    renderCategoriesFilter(state) {
        const ids = state.form?.category_id ?? [];
        window.app.model.categories.forEach((category) => {
            if (ids.includes(category.id)) {
                this.categoryDropDown.selectItem(category.id);
            } else {
                this.categoryDropDown.deselectItem(category.id);
            }
        });
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
            this.currencyDropDown.selectItem(state.form.curr_id);
        }

        const groupType = getGroupTypeByName(state.form.group);
        this.groupDropDown.selectItem(groupType);

        // Render date
        const dateFilter = {
            stdate: (state.filter.stdate ?? null),
            enddate: (state.filter.enddate ?? null),
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
        show(this.noDataMessage, noData);
        show(this.histogram.chartContainer, !noData);

        const data = (noData)
            ? { values: [], series: [] }
            : state.chartData;
        data.stacked = this.isStackedData(state.filter);

        this.histogram.setData(data);
        this.histogram.elem.dataset.time = state.renderTime;
    }

    renderPieChart(state, prevState = {}) {
        if (state.pieChartData === prevState?.pieChartData) {
            return;
        }

        this.pieChart.setData(state.pieChartData);
    }

    renderPieChartInfo(state, prevState = {}) {
        if (state.pieChartInfo === prevState?.pieChartInfo) {
            return;
        }

        if (!state.pieChartInfo) {
            this.pieChartInfoTitle.textContent = null;
            this.pieChartInfoValue.textContent = null;
            return;
        }

        const { categoryId, value } = state.pieChartInfo;
        this.pieChartInfoTitle.textContent = this.getDataCategoryName(categoryId);
        this.pieChartInfoValue.textContent = this.formatValue(value);
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
        this.renderPieChartInfo(state, prevState);

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(StatisticsView);
