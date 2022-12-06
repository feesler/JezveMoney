import 'jezvejs/style';
import {
    ge,
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
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
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
import { correct, formatValue } from '../../js/utils.js';
import './style.scss';

/** CSS classes */
/* Chart popup */
const POPUP_CONTENT_CLASS = 'chart-popup__content';
const POPUP_HEADER_CLASS = 'chart-popup__header';
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
            filter: { ...this.props.filter },
            form: { ...this.props.filter },
            loading: false,
            renderTime: Date.now(),
        };

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
        window.app.checkUserAccountModels();

        this.store = createStore(reducer, initialState);
        this.store.subscribe((state, prevState) => {
            if (state !== prevState) {
                this.render(state, prevState);
            }
        });
    }

    /**
     * View initialization
     */
    onStart() {
        const state = this.store.getState();

        const elemIds = [
            'heading',
            // Filters
            'filtersBtn',
            'filtersContainer',
            'applyFiltersBtn',
            'typeMenu',
            'reportMenu',
            'accountsFilter',
            'currencyFilter',
            'dateFrm',
            // Chart
            'chart',
        ];
        elemIds.forEach((id) => {
            this[id] = ge(id);
            if (!this[id]) {
                throw new Error('Failed to initialize view');
            }
        });

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
            placeholder: 'Select account',
            onitemselect: (obj) => this.onAccountSel(obj),
            onchange: (obj) => this.onAccountSel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initAccountsList(this.accountDropDown);

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
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
            showLegend: true,
            renderLegend: (data) => this.renderLegendContent(data),
            renderYAxisLabel: (value) => this.renderYLabel(value),
        });
        this.histogram.elem.dataset.time = state.renderTime;

        // Loading indicator
        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, this.chart);

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
     * @param {object} obj - selected account item
     */
    onAccountSel(obj) {
        const ids = asArray(obj).map((item) => parseInt(item.id, 10));
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

    formatItemValue(item) {
        const state = this.store.getState();
        return window.app.model.currency.formatCurrency(
            item.value,
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
                    textContent: this.formatItemValue(item),
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
            if (item.columnIndex !== target.item.columnIndex) {
                return;
            }

            listItems.push(this.renderPopupListItem(item));
        });

        const list = createElement('ul', {
            props: { className: POPUP_LIST_CLASS },
            children: listItems,
        });
        const headerTitle = Transaction.getTypeTitle(target.item.groupName);
        const header = createElement('ul', {
            props: { className: POPUP_HEADER_CLASS, textContent: headerTitle },
        });

        return createElement('div', {
            props: { className: POPUP_CONTENT_CLASS },
            children: [header, list],
        });
    }

    getCategoryName(category) {
        const state = this.store.getState();
        const isStacked = (
            state.filter.report === 'account'
            && state.filter.acc_id?.length > 1
        );
        if (isStacked) {
            const account = window.app.model.userAccounts.getItem(category);
            return account.name;
        }

        const selectedTypes = asArray(state.form.type);
        return Transaction.getTypeTitle(selectedTypes[category]);
    }

    renderYLabel(value) {
        let val = value;
        let size = '';
        if (value >= 1e12) {
            val = correct(value / 1e12, 2);
            size = 'T';
        } else if (value >= 1e9) {
            val = correct(value / 1e9, 2);
            size = 'B';
        } else if (value >= 1e6) {
            val = correct(value / 1e6, 2);
            size = 'M';
        } else if (value >= 1e3) {
            val = correct(value / 1e3, 2);
            size = 'k';
        }

        const fmtValue = formatValue(val);
        return `${fmtValue}${size}`;
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
                        textContent: this.getCategoryName(category),
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

        const isByCurrency = (state.form.report === 'currency');
        this.reportMenu.setActive(state.form.report);

        show(this.accountsFilter, !isByCurrency);
        show(this.currencyFilter, isByCurrency);

        this.renderAccountsFilter(state);

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
        data.stacked = (
            state.filter.report === 'account'
            && state.filter.acc_id?.length > 1
        );

        this.histogram.setData(data);
        this.histogram.elem.dataset.time = state.renderTime;
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

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(StatisticsView);
