import 'jezvejs/style';
import {
    createElement,
    show,
    asArray,
    rgbToHSL,
    hslToRGB,
    rgbToColor,
    MAX_LIGHTNESS,
    getClassName,
} from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

// Application
import {
    __,
    dateStringToTime,
    formatDateRange,
    formatNumberShort,
    getApplicationURL,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

// Models
import { CurrencyList } from '../../Models/CurrencyList.js';
import { UserCurrencyList } from '../../Models/UserCurrencyList.js';
import { AccountList } from '../../Models/AccountList.js';
import { CategoryList } from '../../Models/CategoryList.js';

// Common components
import { ChartPopup } from '../../Components/Common/ChartPopup/ChartPopup.js';
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { FiltersContainer } from '../../Components/List/FiltersContainer/FiltersContainer.js';
import { LoadingIndicator } from '../../Components/Common/LoadingIndicator/LoadingIndicator.js';

// Local components
import { PieChartGroup } from './components/PieChartGroup/PieChartGroup.js';
import { StatisticsFilters } from './components/Filters/StatisticsFilters.js';

import {
    formatDateLabel,
    formatValue,
    getDataCategoryName,
    isStackedData,
} from './helpers.js';
import { isSameSelection, actions, reducer } from './reducer.js';
import '../../Application/Application.scss';
import './StatisticsView.scss';

/* CSS classes */
const LEGEND_LIST_CLASS = 'chart__legend-list';
const LEGEND_ITEM_CLASS = 'chart-legend__item';
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
        this.createColorStyle();

        this.loadElementsByIds([
            'heading',
            'contentHeader',
            'mainContent',
            // Histogram
            'chart',
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
            showPopupOnClick: true,
            animatePopup: true,
            activateOnClick: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
            showLegend: true,
            renderLegend: (data) => this.renderLegendContent(data),
            renderYAxisLabel: (value) => formatNumberShort(value),
            renderXAxisLabel: (value) => formatDateLabel(value, this.store.getState()),
            onItemClick: (target) => this.onSelectDataColumn(target),
        });
        this.chart.append(this.histogram.elem);

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
        this.mainContent.append(this.pieChart.elem);

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

    createColorStyle() {
        const ACTIVE_LIGHTNESS_STEP = 15;
        const activeColors = {};

        const rules = App.model.categories.map((item) => {
            if (!activeColors[item.color]) {
                const hsl = rgbToHSL(item.color);
                const lighten = (hsl.lightness + ACTIVE_LIGHTNESS_STEP <= MAX_LIGHTNESS);
                hsl.lightness += ((lighten) ? 1 : -1) * ACTIVE_LIGHTNESS_STEP;
                activeColors[item.color] = rgbToColor(hslToRGB(hsl));
            }

            return `.categories-report .chart_stacked .histogram_category-${item.id},
            .categories-report .pie__sector-${item.id},
            .categories-report .legend-item-${item.id},
            .categories-report .chart-popup-list__item-cat-${item.id} {
                --category-color: ${item.color};
                --category-active-color: ${activeColors[item.color]};
            }`;
        });

        const style = createElement('style', { props: { textContent: rules.join('') } });
        document.body.appendChild(style);
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
        this.store.dispatch(actions.changeTypeFilter(selected));
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

        this.store.dispatch(actions.changeDateFilter(data));
        this.requestData(this.getRequestData());
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

    /** Returns content of chart popup for specified target */
    renderPopupContent(target) {
        const state = this.store.getState();
        return ChartPopup.fromTarget(target, {
            reportType: state.filter?.report,
            formatValue: (value) => formatValue(value, state),
            renderDateLabel: (value) => formatDateLabel(value, state),
        });
    }

    renderLegendContent(categories) {
        if (!Array.isArray(categories) || categories.length === 0) {
            return null;
        }

        const state = this.store.getState();
        const categoryReport = (state.filter.report === 'category');

        return createElement('ul', {
            props: { className: LEGEND_LIST_CLASS },
            children: categories.map((category, index) => {
                const id = (categoryReport) ? category : (index + 1);
                const item = createElement('li', {
                    props: {
                        className: getClassName(
                            LEGEND_ITEM_CLASS,
                            `legend-item-${id}`,
                        ),
                    },
                    children: createElement('span', {
                        props: {
                            className: LEGEND_ITEM_TITLE_CLASS,
                            textContent: getDataCategoryName(category, state),
                        },
                    }),
                });

                return item;
            }),
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

    renderHistogram(state, prevState = {}) {
        if (
            state.chartData === prevState.chartData
            && state.filter?.report === prevState.filter?.report
        ) {
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
        data.stacked = isStackedData(state.filter);

        this.histogram.setData(data);

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
