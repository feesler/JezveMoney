import 'jezvejs/style';
import {
    createElement,
    getClassName,
    show,
    asArray,
} from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { DropDown } from 'jezvejs/DropDown';
import { LinkMenu } from 'jezvejs/LinkMenu';
import { Button } from 'jezvejs/Button';
import { PieChart } from 'jezvejs/PieChart';
import { createStore } from 'jezvejs/Store';

import { normalize } from '../../utils/decimal.js';
import {
    __,
    getWeekRange,
    getMonthRange,
    getHalfYearRange,
    dateStringToTime,
    formatDateRange,
    formatNumberShort,
    getApplicationURL,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import { AppView } from '../../Components/AppView/AppView.js';

import { CurrencyList } from '../../Models/CurrencyList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Transaction } from '../../Models/Transaction.js';

import { Heading } from '../../Components/Heading/Heading.js';
import { CategorySelect } from '../../Components/Inputs/CategorySelect/CategorySelect.js';
import { FieldHeaderButton } from '../../Components/Fields/FieldHeaderButton/FieldHeaderButton.js';
import { DateRangeInput } from '../../Components/Inputs/Date/DateRangeInput/DateRangeInput.js';
import { TransactionTypeMenu } from '../../Components/Fields/TransactionTypeMenu/TransactionTypeMenu.js';
import { FiltersContainer } from '../../Components/FiltersContainer/FiltersContainer.js';
import { FormControls } from '../../Components/FormControls/FormControls.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';

import { isSameSelection, actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './StatisticsView.scss';

/* CSS classes */
const FILTER_HEADER_CLASS = 'filter-item__title';
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
class StatisticsView extends AppView {
    constructor(...args) {
        super(...args);

        if (!('accountCurrency' in this.props)) {
            throw new Error('Invalid Statistics view properties');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        const { filter } = this.props;

        const initialState = {
            accountCurrency: this.props.accountCurrency,
            chartData: null,
            selectedColumn: null,
            pieChartInfo: null,
            selectedPieChartItem: null,
            filter: { ...filter },
            form: {
                ...filter,
                ...formatDateRange(filter),
            },
            loading: false,
            renderTime: Date.now(),
        };

        App.loadModel(CurrencyList, 'currency', App.props.currency);
        App.loadModel(UserCurrencyList, 'userCurrencies', App.props.userCurrencies);
        App.loadModel(AccountList, 'accounts', App.props.accounts);
        App.checkUserAccountModels();
        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.initCategoriesModel();

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
            'typeFilter',
            'reportTypeFilter',
            'groupTypeFilter',
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
            title: __('statistics.title'),
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

        // Controls
        this.filtersControls = FormControls.create({
            className: 'filters-controls',
            submitTitle: __('actions.apply'),
            onSubmitClick: () => this.filters.close(),
            cancelTitle: null,
        });
        this.filtersContainer.append(this.filtersControls.elem);

        // Transaction type filter
        this.typeMenu = TransactionTypeMenu.create({
            id: 'typeMenu',
            multiple: true,
            allowActiveLink: true,
            showAll: false,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });
        this.typeFilter.append(this.typeMenu.elem);

        // Report type filter
        this.reportMenu = LinkMenu.create({
            id: 'reportMenu',
            itemParam: 'report',
            items: [
                { value: 'category', title: __('statistics.reports.categories') },
                { value: 'account', title: __('statistics.reports.accounts') },
                { value: 'currency', title: __('statistics.reports.currencies') },
            ],
            onChange: (value) => this.onSelectReportType(value),
        });
        this.reportTypeFilter.append(this.reportMenu.elem);

        // Currency filter
        this.currencyDropDown = DropDown.create({
            elem: 'curr_id',
            enableFilter: true,
            onItemSelect: (obj) => this.onCurrencySel(obj),
            className: 'dd_fullwidth',
        });
        App.initUserCurrencyList(this.currencyDropDown);

        // Accounts filter
        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            multiple: true,
            placeholder: __('typeToFilter'),
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onItemSelect: (obj) => this.onAccountSel(obj),
            onChange: (obj) => this.onAccountSel(obj),
            className: 'dd_fullwidth',
        });
        App.initAccountsList(this.accountDropDown);

        // Categories filter
        this.categoryDropDown = CategorySelect.create({
            elem: 'category_id',
            multiple: true,
            placeholder: __('typeToFilter'),
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onItemSelect: (obj) => this.onCategorySel(obj),
            onChange: (obj) => this.onCategorySel(obj),
            className: 'dd_fullwidth',
        });

        // 'Group by' filter
        const { groupTypes } = this.props;
        this.groupTypeMenu = LinkMenu.create({
            id: 'groupTypeMenu',
            itemParam: 'group',
            items: Object.values(groupTypes).map(({ name, title }) => ({
                value: name,
                title,
            })),
            onChange: (value) => this.onSelectGroupType(value),
        });
        this.groupTypeFilter.append(this.groupTypeMenu.elem);

        // Date range filter
        this.dateRangeFilterTitle = createElement('span', {
            props: { textContent: __('filters.dateRange') },
        });

        this.weekRangeBtn = FieldHeaderButton.create({
            dataValue: 'week',
            title: __('dateRange.forWeek'),
            onClick: (e) => this.showWeekRange(e),
        });

        this.monthRangeBtn = FieldHeaderButton.create({
            dataValue: 'month',
            title: __('dateRange.forMonth'),
            onClick: (e) => this.showMonthRange(e),
        });

        this.halfYearRangeBtn = FieldHeaderButton.create({
            dataValue: 'halfyear',
            title: __('dateRange.forHalfYear'),
            onClick: (e) => this.showHalfYearRange(e),
        });

        this.dateRangeHeader = createElement('header', {
            props: { className: FILTER_HEADER_CLASS },
            children: [
                this.dateRangeFilterTitle,
                this.weekRangeBtn.elem,
                this.monthRangeBtn.elem,
                this.halfYearRangeBtn.elem,
            ],
        });

        this.dateRangeFilter = DateRangeInput.create({
            id: 'dateFrm',
            startPlaceholder: __('dateRange.from'),
            endPlaceholder: __('dateRange.to'),
            onChange: (data) => this.changeDateFilter(data),
        });

        this.dateFilter.append(this.dateRangeHeader, this.dateRangeFilter.elem);

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
            renderYAxisLabel: (value) => formatNumberShort(value),
            renderXAxisLabel: (value) => this.renderDateLabel(value),
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
        const accounts = asArray(state.form.accounts);
        if (state.form.report === 'account' && accounts.length === 0) {
            const account = App.model.userAccounts.getItemByIndex(0);
            this.store.dispatch(actions.changeAccountsFilter([account.id]));
        }

        this.requestData(this.getRequestData());
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
        return getApplicationURL('statistics/', { ...state.filter });
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.store.dispatch(actions.changeTypeFilter(selected));
        this.requestData(this.getRequestData());
    }

    /** Date range filter change handler */
    changeDateFilter(data) {
        const { filter } = this.store.getState();
        const startDate = filter.startDate ?? null;
        const endDate = filter.endDate ?? null;
        const timeData = {
            startDate: dateStringToTime(data.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(data.endDate, { fixShortYear: false }),
        };

        if (startDate === timeData.startDate && endDate === timeData.endDate) {
            return;
        }

        this.store.dispatch(actions.changeDateFilter(data));
        this.requestData(this.getRequestData());
    }

    showWeekRange(e) {
        e.preventDefault();

        const range = getWeekRange();
        this.changeDateFilter(formatDateRange(range));
    }

    showMonthRange(e) {
        e.preventDefault();

        const range = getMonthRange();
        this.changeDateFilter(formatDateRange(range));
    }

    showHalfYearRange(e) {
        e.preventDefault();

        const range = getHalfYearRange();
        this.changeDateFilter(formatDateRange(range));
    }

    /**
     * Report type select callback
     * @param {string} value - selected report type
     */
    onSelectReportType(value) {
        this.store.dispatch(actions.changeReportType(value));
        this.requestData(this.getRequestData());
    }

    /**
     * Account select callback
     * @param {object} accounts - selected accounts
     */
    onAccountSel(accounts) {
        const ids = asArray(accounts).map((item) => parseInt(item.id, 10));
        const state = this.store.getState();
        const filterIds = state.form.accounts ?? [];
        if (isSameSelection(ids, filterIds)) {
            return;
        }

        this.store.dispatch(actions.changeAccountsFilter(ids));
        this.requestData(this.getRequestData());
    }

    /**
     * Categories select callback
     * @param {object} categories - selected categories
     */
    onCategorySel(categories) {
        const ids = asArray(categories).map((item) => parseInt(item.id, 10));
        const state = this.store.getState();
        const filterIds = state.form.categories ?? [];
        if (isSameSelection(ids, filterIds)) {
            return;
        }

        this.store.dispatch(actions.changeCategoriesFilter(ids));
        this.requestData(this.getRequestData());
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
        this.requestData(this.getRequestData());
    }

    /**
     * Group type select callback
     * @param {string} value - selected group item
     */
    onSelectGroupType(value) {
        this.store.dispatch(actions.changeGroupType(value));
        this.requestData(this.getRequestData());
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
        const pageTitle = `${__('appName')} | ${__('statistics.title')}`;
        window.history.replaceState({}, pageTitle, url);
    }

    getRequestData() {
        const { form } = this.store.getState();

        const res = {
            ...form,
            startDate: dateStringToTime(form.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(form.endDate, { fixShortYear: false }),
        };

        return res;
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
                App.createErrorNotification(e.message);
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
        return App.model.currency.formatCurrency(
            value,
            state.accountCurrency,
        );
    }

    formatPercent(value) {
        return `${normalize(value, 2)} %`;
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
        const seriesTitle = this.renderDateLabel(target.series);
        const series = createElement('div', {
            props: { className: POPUP_SERIES_CLASS, textContent: seriesTitle },
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
            || (report === 'account' && filter.accounts?.length > 1)
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
            const account = App.model.userAccounts.getItem(categoryId);
            return account.name;
        }

        if (state.filter.report === 'category') {
            if (categoryId === 0) {
                return __('categories.noCategory');
            }

            const category = App.model.categories.getItem(categoryId);
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

    renderDateLabel(value) {
        const state = this.store.getState();
        const { group } = state.form;

        if (group === 'day' || group === 'week') {
            return App.formatDate(value);
        }

        if (group === 'month') {
            return App.formatDate(value, {
                locales: App.dateFormatLocale,
                options: { year: 'numeric', month: '2-digit' },
            });
        }

        if (group === 'year') {
            return App.formatDate(value, {
                locales: App.dateFormatLocale,
                options: { year: 'numeric' },
            });
        }

        return null;
    }

    renderAccountsFilter(state) {
        const ids = state.form?.accounts ?? [];
        const selection = [];

        App.model.userAccounts.forEach((account) => {
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
        const ids = state.form?.categories ?? [];
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

        const { report, group } = state.form;
        this.reportMenu.setActive(report);

        show(this.accountsFilter, (report === 'account'));
        show(this.categoriesFilter, (report === 'category'));
        show(this.currencyFilter, (report === 'currency'));

        this.renderAccountsFilter(state);
        this.renderCategoriesFilter(state);

        if (state.form.curr_id) {
            this.currencyDropDown.setSelection(state.form.curr_id);
        }

        this.groupTypeMenu.setActive(group);

        // Date range filter
        this.dateRangeFilter.setState((rangeState) => ({
            ...rangeState,
            form: {
                ...rangeState.form,
                startDate: state.form.startDate,
                endDate: state.form.endDate,
            },
            filter: {
                ...rangeState.filter,
                startDate: dateStringToTime(state.form.startDate),
                endDate: dateStringToTime(state.form.endDate),
            },
        }));

        const showRangeSelectors = (group === 'day' || group === 'week');
        const dateFilterURL = this.getFilterURL(state, false);
        const weekRange = getWeekRange();
        dateFilterURL.searchParams.set('startDate', weekRange.startDate);
        dateFilterURL.searchParams.set('endDate', weekRange.endDate);
        this.weekRangeBtn.show(showRangeSelectors);
        this.weekRangeBtn.setURL(dateFilterURL.toString());

        const monthRange = getMonthRange();
        dateFilterURL.searchParams.set('startDate', monthRange.startDate);
        this.monthRangeBtn.show(showRangeSelectors);
        this.monthRangeBtn.setURL(dateFilterURL.toString());

        const halfYearRange = getHalfYearRange();
        dateFilterURL.searchParams.set('startDate', halfYearRange.startDate);
        this.halfYearRangeBtn.show(showRangeSelectors);
        this.halfYearRangeBtn.setURL(dateFilterURL.toString());
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
        this.pieChartHeaderDate.textContent = this.renderDateLabel(series);

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

App.createView(StatisticsView);
