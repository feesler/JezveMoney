import 'jezvejs/style';
import { createElement, show } from '@jezvejs/dom';
import { asArray } from '@jezvejs/types';
import { Histogram } from 'jezvejs/Histogram';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

// Application
import {
    __,
    createColorStyle,
    dateStringToTime,
    formatDateRange,
    formatNumberShort,
} from '../../utils/utils.js';
import {
    formatDateLabel,
    formatLongDateLabel,
    formatValue,
    isStackedData,
} from '../../utils/statistics.js';
import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { CategoryList } from '../../Models/CategoryList.js';

// Common components
import { ChartLegend } from '../../Components/Common/ChartLegend/ChartLegend.js';
import { ChartPopup } from '../../Components/Common/ChartPopup/ChartPopup.js';
import { NoDataMessage } from '../../Components/Common/NoDataMessage/NoDataMessage.js';
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { FiltersContainer } from '../../Components/List/FiltersContainer/FiltersContainer.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';

// Local components
import { PieChartGroup } from './components/PieChartGroup/PieChartGroup.js';
import { StatisticsFilters } from './components/Filters/StatisticsFilters.js';

import { isSameSelection, actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './StatisticsView.scss';

/* CSS classes */

const defaultProps = {
    filter: {},
};

/**
 * Statistics view
 */
class StatisticsView extends AppView {
    constructor(...args) {
        super(...args);

        if (!('chartCurrency' in this.props)) {
            throw new Error('Invalid Statistics view properties');
        }

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        const { filter } = this.props;

        const initialState = {
            chartCurrency: this.props.chartCurrency,
            chartData: null,
            selectedColumn: null,
            pieChartInfo: null,
            selectedPieChartItem: null,
            expandedLegend: false,
            legendCategories: null,
            activeCategory: null,
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
        createColorStyle();

        this.loadElementsByIds([
            'heading',
            'contentHeader',
            'mainContent',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: __('statistics.title'),
        });

        // Filters
        this.filtersBtn = Button.create({
            id: 'filtersBtn',
            className: 'circle-btn',
            icon: 'filter',
            onClick: () => this.onToggleFilters(),
        });
        this.heading.actionsContainer.prepend(this.filtersBtn.elem);

        this.filters = StatisticsFilters.create({
            groupTypes: this.props.groupTypes,
            getURL: (...args) => this.getFilterURL(...args),
            onChangeTypeFilter: (value) => this.onChangeTypeFilter(value),
            onSelectReportType: (value) => this.onSelectReportType(value),
            onSelectGroupType: (value) => this.onSelectGroupType(value),
            onAccountsChange: (selected) => this.onAccountSel(selected),
            onCategoriesChange: (selected) => this.onCategorySel(selected),
            onCurrencyChange: (selected) => this.onCurrencySel(selected),
            onChangeDateRange: (range) => this.onChangeDateRange(range),
            onApplyFilters: () => this.onApplyFilters(),
        });

        this.filtersContainer = FiltersContainer.create({
            content: this.filters.elem,
        });
        this.contentHeader.prepend(this.filtersContainer.elem);

        // No data message
        this.noDataMessage = NoDataMessage.create({
            title: __('statistics.noData'),
        });

        // Chart
        this.histogram = Histogram.create({
            height: 320,
            marginTop: 35,
            scrollToEnd: true,
            autoScale: true,
            animate: true,
            barWidth: 45,
            columnGap: 3,
            showPopupOnHover: true,
            showPopupOnClick: true,
            animatePopup: true,
            activateOnClick: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
            showLegend: true,
            expandedLegend: false,
            renderLegend: (...args) => this.renderLegend(...args),
            onlyVisibleCategoriesLegend: true,
            renderYAxisLabel: (value) => formatNumberShort(value),
            renderXAxisLabel: (value) => formatDateLabel(value, this.store.getState()),
            onItemClick: (target) => this.onSelectDataColumn(target),
            setActiveCategory: (value) => this.dispatch(actions.toggleActivateChartCategory(value)),
            setLegendCategories: (value) => this.dispatch(actions.setLegendCategories(value)),
            toggleExpandLegend: () => this.dispatch(actions.toggleExpandLegend()),
            components: {
                Legend: ChartLegend,
            },
        });

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create({
            fixed: false,
        });

        // Histogram chart container
        this.chart = createElement('div', {
            props: { className: 'stat-histogram' },
            children: [
                this.histogram.elem,
                this.noDataMessage.elem,
                this.loadingIndicator.elem,
            ],
        });

        // Pie chart
        this.pieChart = PieChartGroup.create({
            data: null,
            radius: 150,
            innerRadius: 120,
            offset: 10,
            onItemOver: (item) => this.onPieChartItemOver(item),
            onItemOut: (item) => this.onPieChartItemOut(item),
            onItemClick: (item) => this.onPieChartItemClick(item),
        });

        this.mainContent.append(this.chart, this.pieChart.elem);

        this.subscribeToStore(this.store);
        this.onPostInit();
    }

    onPostInit() {
        const state = this.store.getState();

        // Select first account if nothing selected on account report type
        const accounts = asArray(state.form.accounts);
        if (state.form.report === 'account' && accounts.length === 0) {
            const account = App.model.userAccounts.getItemByIndex(0);
            this.dispatch(actions.changeAccountsFilter([account.id]));
        }

        this.requestData(this.getRequestData());
    }

    /** Set loading state and render view */
    startLoading() {
        this.dispatch(actions.startLoading());
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.dispatch(actions.stopLoading());
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state) {
        return App.getURL('statistics/', { ...state.filter });
    }

    onApplyFilters() {
        this.filtersContainer.close();
    }

    onToggleFilters() {
        this.filtersContainer.toggle();
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.dispatch(actions.changeTypeFilter(selected));
        this.requestData(this.getRequestData());
    }

    /** Date range filter change handler */
    onChangeDateRange(data) {
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

        this.dispatch(actions.changeDateFilter(data));
        this.requestData(this.getRequestData());
    }

    /**
     * Report type select callback
     * @param {string} value - selected report type
     */
    onSelectReportType(value) {
        this.dispatch(actions.changeReportType(value));
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

        this.dispatch(actions.changeAccountsFilter(ids));
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

        this.dispatch(actions.changeCategoriesFilter(ids));
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

        this.dispatch(actions.changeCurrencyFilter(obj.id));
        this.requestData(this.getRequestData());
    }

    /**
     * Group type select callback
     * @param {string} value - selected group item
     */
    onSelectGroupType(value) {
        this.dispatch(actions.changeGroupType(value));
        this.requestData(this.getRequestData());
    }

    /** Histogram item 'click' event handler */
    onSelectDataColumn(target) {
        this.dispatch(actions.selectDataColumn(target));
    }

    /** Pie chart item 'mouseover' event handler */
    onPieChartItemOver(item) {
        this.dispatch(actions.showPieChartInfo(item));
    }

    /** Pie chart item 'mouseout' event handler */
    onPieChartItemOut(item) {
        this.dispatch(actions.hidePieChartInfo(item));
    }

    /** Pie chart item 'click' event handler */
    onPieChartItemClick(item) {
        this.dispatch(actions.selectPieChartItem(item));
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
            this.dispatch(actions.dataRequestLoaded(result.data));
        } catch (e) {
            aborted = e.name === 'AbortError';
            if (!aborted) {
                App.createErrorNotification(e.message);
                this.dispatch(actions.dataRequestError());
            }
        }

        if (!aborted) {
            this.stopLoading();
            this.dispatch(actions.setRenderTime());
        }
    }

    /** Returns content of chart popup for specified target */
    renderPopupContent(target) {
        const state = this.store.getState();
        return ChartPopup.fromTarget(target, {
            filter: state.filter,
            formatValue: (value) => formatValue(value, state),
            renderDateLabel: (value) => formatLongDateLabel(value, state),
        });
    }

    renderFilters(state, prevState = {}) {
        if (state.filter !== prevState.filter) {
            this.replaceHistory(state);
        }

        this.filters.setState((filtersState) => ({
            ...filtersState,
            ...state,
        }));
    }

    renderLegend(items, state) {
        const categories = asArray(items);

        this.notifyEvent('setLegendCategories', categories);

        if (!this.legend) {
            const Legend = ChartLegend;
            this.legend = Legend.create({
                ...state,
                categories,
            });
        } else {
            this.legend.setState((legendState) => ({
                ...legendState,
                ...state,
                categories,
            }));
        }

        return this.legend.elem;
    }

    renderHistogram(state, prevState = {}) {
        if (
            state.chartData === prevState.chartData
            && state.filter?.report === prevState.filter?.report
            && state.activeCategory === prevState.activeCategory
            && state.expandedLegend === prevState.expandedLegend
        ) {
            return;
        }

        const [value] = state.chartData?.values ?? [];
        const dataSet = value?.data ?? [];
        const noData = !dataSet.length && !state.chartData?.series?.length;
        this.noDataMessage.show(state.chartData && noData);
        show(this.histogram.chartContainer, !noData);

        if (!noData && state.filter !== prevState.filter) {
            this.histogram.setState((chartState) => ({
                ...chartState,
                filter: state.filter,
                expandedLegend: state.expandedLegend,
            }));
        }

        if (state.chartData !== prevState.chartData) {
            const data = (noData)
                ? { values: [], series: [] }
                : state.chartData;
            data.stacked = isStackedData(state.filter);

            this.histogram.setData(data);
        }

        if (state.activeCategory !== prevState.activeCategory) {
            this.histogram.setActiveCategory(state.activeCategory);
        }

        if (state.expandedLegend !== prevState.expandedLegend) {
            this.histogram.setState((chartState) => ({
                ...chartState,
                expandedLegend: state.expandedLegend,
            }));
        }

        this.histogram.elem.classList.toggle('categories-report', state.filter.report === 'category');
    }

    renderPieChart(state, prevState) {
        if (
            state.form === prevState?.form
            && state.filter === prevState?.filter
            && state.selectedColumn === prevState?.selectedColumn
            && state.pieChartInfo === prevState?.pieChartInfo
        ) {
            return;
        }

        if (!state.selectedColumn) {
            this.pieChart.hide();
            return;
        }

        this.pieChart.setState((chartState) => ({
            ...chartState,
            ...state,
        }));
        this.pieChart.show();
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

        this.histogram.elem.dataset.time = state.renderTime;

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

App.createView(StatisticsView);
