import 'jezvejs/style';
import {
    ge,
    ce,
    setEvents,
    insertAfter,
    isDate,
    show,
} from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { DatePicker } from 'jezvejs/DatePicker';
import { DropDown } from 'jezvejs/DropDown';
import { Application } from '../../js/Application.js';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import '../../css/app.scss';
import '../../Components/TransactionTypeMenu/style.scss';
import './style.scss';

/** CSS classes */
const POPUP_LIST_CLASS = 'chart-popup-list';
const POPUP_LIST_ITEM_CLASS = 'chart-popup-list__item';
const POPUP_LIST_VALUE_CLASS = 'chart-popup-list__value';

/** Strings */
const PAGE_TITLE = 'Jezve Money | Statistics';

/**
 * Statistics view
 */
class StatisticsView extends View {
    constructor(...args) {
        super(...args);

        if (!('accountCurrency' in this.props)) {
            throw new Error('Invalid Statistics view properties');
        }

        this.groupTypes = [null, 'day', 'week', 'month', 'year'];

        this.state = {
            selDateRange: null,
            accountCurrency: this.props.accountCurrency,
            chartData: null,
            filter: this.props.filter,
            loading: false,
            renderTime: Date.now(),
        };

        this.state.filter = ('filter' in this.props) ? this.props.filter : {};

        window.app.loadModel(CurrencyList, 'currency', window.app.props.currency);
        window.app.loadModel(AccountList, 'accounts', window.app.props.accounts);
    }

    /**
     * View initialization
     */
    onStart() {
        const chartElem = ge('chart');
        this.noDataMessage = chartElem.querySelector('.nodata-message');
        this.histogram = Histogram.create({
            elem: chartElem,
            height: 320,
            marginTop: 35,
            scrollToEnd: true,
            autoScale: true,
            scrollThrottle: 100,
            showPopup: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
        });

        this.histogram.elem.dataset.time = this.state.renderTime;

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, chartElem);

        this.typeMenu = TransactionTypeMenu.fromElement(document.querySelector('.trtype-menu'), {
            allowActiveLink: true,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        this.filterTypeDropDown = DropDown.create({
            elem: 'filter_type',
            onitemselect: (obj) => this.onFilterSel(obj),
            className: 'dd_fullwidth',
        });

        this.accountField = ge('acc_block');
        this.currencyField = ge('curr_block');

        this.currencyDropDown = DropDown.create({
            elem: 'curr_id',
            onitemselect: (obj) => this.onCurrencySel(obj),
            className: 'dd_fullwidth',
        });

        window.app.initCurrencyList(this.currencyDropDown);

        if (this.state.filter.curr_id) {
            this.currencyDropDown.selectItem(this.state.filter.curr_id);
        }

        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            onitemselect: (obj) => this.onAccountSel(obj),
            className: 'dd_fullwidth',
        });

        window.app.initAccountsList(this.accountDropDown);

        if (this.state.filter.acc_id) {
            this.accountDropDown.selectItem(this.state.filter.acc_id);
        }

        this.groupDropDown = DropDown.create({
            elem: 'groupsel',
            onitemselect: (obj) => this.onGroupSel(obj),
            className: 'dd_fullwidth',
        });

        this.datePickerBtn = IconLink.fromElement({
            elem: 'calendar_btn',
            onclick: () => this.showCalendar(),
        });
        this.dateBlock = ge('date_block');
        this.datePickerWrapper = ge('calendar');

        this.dateInputBtn = ge('cal_rbtn');
        if (this.dateInputBtn) {
            this.dateInputBtn.addEventListener('click', () => this.showCalendar());
        }
        this.dateInput = ge('date');

        this.noDateBtn = ge('nodatebtn');
        if (!this.noDateBtn) {
            throw new Error('Failed to initialize Transaction List view');
        }
        setEvents(this.noDateBtn, { click: () => this.onDateClear() });

        this.requestData(this.state.filter);
    }

    /** Set loading state and render view */
    startLoading() {
        this.state.loading = true;
        this.render(this.state);
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.state.loading = false;
        this.render(this.state);
    }

    /** Returns URL for filter of specified state */
    getFilterURL(state = this.state) {
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

    getGroupTypeByName(name) {
        const groupName = (name) ? name.toLowerCase() : null;
        return this.groupTypes.indexOf(groupName);
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.state.filter.type = selected;
        this.requestData(this.state.filter);
    }

    /**
     * Date range select calback
     * @param {Range} range - object with 'start' and 'end' date properties
     */
    onRangeSelect(range) {
        if (!range || !isDate(range.start) || !isDate(range.end)) {
            return;
        }

        this.selDateRange = range;
        this.datePicker.hide();
        const start = window.app.formatDate(range.start);
        const end = window.app.formatDate(range.end);

        this.dateInput.value = `${start} - ${end}`;
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        if (!this.selDateRange) {
            return;
        }

        this.state.filter.stdate = window.app.formatDate(this.selDateRange.start);
        this.state.filter.enddate = window.app.formatDate(this.selDateRange.end);

        this.requestData(this.state.filter);
    }

    /**
     * Show calendar block
     */
    showCalendar() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.datePickerWrapper.parentNode,
                locales: window.app.datePickerLocale,
                range: true,
                onrangeselect: (range) => this.onRangeSelect(range),
                onhide: () => this.onDatePickerHide(),
            });
            this.datePickerWrapper.append(this.datePicker.elem);
        }
        if (!this.datePicker) {
            return;
        }

        this.datePicker.show(!this.datePicker.visible());

        this.datePickerBtn.hide();
        show(this.dateBlock, true);
    }

    /**
     * Clear date range query
     */
    onDateClear() {
        if (!('stdate' in this.state.filter) && !('enddate' in this.state.filter)) {
            return;
        }
        this.datePicker?.hide();

        delete this.state.filter.stdate;
        delete this.state.filter.enddate;
        this.requestData(this.state.filter);
    }

    /**
     * Filter type select callback
     * @param {object} obj - selected filter type item
     */
    onFilterSel(obj) {
        if (!obj) {
            return;
        }

        const filterType = (parseInt(obj.id, 10) === 1) ? 'currency' : null;
        if (filterType) {
            this.state.filter.filter = filterType;
        } else if ('filter' in this.state.filter) {
            delete this.state.filter.filter;
        }

        this.requestData(this.state.filter);
    }

    /**
     * Account select callback
     * @param {object} obj - selected account item
     */
    onAccountSel(obj) {
        if (!obj) {
            return;
        }

        this.state.filter.acc_id = obj.id;
        this.requestData(this.state.filter);
    }

    /**
     * Currency select callback
     * @param {object} obj - selected currency item
     */
    onCurrencySel(obj) {
        if (!obj) {
            return;
        }

        this.state.filter.curr_id = obj.id;
        this.requestData(this.state.filter);
    }

    /**
     * Group select callback
     * @param {object} obj - selected group item
     */
    onGroupSel(obj) {
        if (!obj) {
            return;
        }

        const groupId = parseInt(obj.id, 10);
        const group = (groupId < this.groupTypes.length) ? this.groupTypes[groupId] : null;
        if (group) {
            this.state.filter.group = group;
        } else if ('group' in this.state.filter) {
            delete this.state.filter.group;
        }

        this.requestData(this.state.filter);
    }

    replaceHistory() {
        const url = this.getFilterURL();
        window.history.replaceState({}, PAGE_TITLE, url);
    }

    async requestData(options) {
        this.startLoading();

        try {
            const result = await API.transaction.statistics(options);

            this.state.chartData = { ...result.data.histogram };
            this.state.filter = { ...result.data.filter };
        } catch (e) {
            return;
        }

        this.replaceHistory();
        this.state.renderTime = Date.now();
        this.stopLoading();
    }

    formatItemValue(item) {
        return window.app.model.currency.formatCurrency(
            item.value,
            this.state.accountCurrency,
        );
    }

    /** Returns content of chart popup for specified target */
    renderPopupContent(target) {
        if (!target) {
            return null;
        }

        const items = target.group ?? [target.item];
        const elems = items.map((item) => ce(
            'li',
            { className: POPUP_LIST_ITEM_CLASS },
            ce('span', {
                className: POPUP_LIST_VALUE_CLASS,
                textContent: this.formatItemValue(item),
            }),
        ));

        return ce('ul', { className: POPUP_LIST_CLASS }, elems);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (state.loading) {
            this.loadingIndicator.show();
        }

        const filterUrl = this.getFilterURL(state);

        this.typeMenu.setURL(filterUrl);
        this.typeMenu.setSelection(state.filter.type);

        const isByCurrency = (state.filter.filter === 'currency');
        this.filterTypeDropDown.selectItem((isByCurrency) ? 1 : 0);

        show(this.accountField, !isByCurrency);
        show(this.currencyField, isByCurrency);

        if (state.filter.acc_id) {
            this.accountDropDown.selectItem(state.filter.acc_id);
        }
        if (state.filter.curr_id) {
            this.currencyDropDown.selectItem(state.filter.curr_id);
        }

        const groupType = this.getGroupTypeByName(state.filter.group);
        this.groupDropDown.selectItem(groupType);

        // Render date
        const isDateFilter = !!(state.filter.stdate && state.filter.enddate);
        const dateRangeFmt = (isDateFilter)
            ? `${state.filter.stdate} - ${state.filter.enddate}`
            : '';
        this.dateInput.value = dateRangeFmt;
        const dateSubtitle = (isDateFilter) ? dateRangeFmt : null;
        this.datePickerBtn.setSubtitle(dateSubtitle);
        show(this.noDateBtn, isDateFilter);

        // Render histogram
        const noData = !state.chartData?.values?.length && !state.chartData?.series?.length;
        show(this.noDataMessage, noData);
        show(this.histogram.chartContainer, !noData);

        if (state.chartData) {
            this.histogram.setData(state.chartData);
        }
        this.histogram.elem.dataset.time = state.renderTime;

        if (!state.loading) {
            this.loadingIndicator.hide();
        }
    }
}

window.app = new Application(window.appProps);
window.app.createView(StatisticsView);
