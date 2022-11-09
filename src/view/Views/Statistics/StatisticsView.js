import 'jezvejs/style';
import {
    ge,
    createElement,
    insertAfter,
    show,
    asArray,
} from 'jezvejs';
import { Histogram } from 'jezvejs/Histogram';
import { DropDown } from 'jezvejs/DropDown';
import 'jezvejs/style/InputGroup';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { API } from '../../js/api/index.js';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { AccountList } from '../../js/model/AccountList.js';
import { LinkMenu } from '../../Components/LinkMenu/LinkMenu.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import './style.scss';
import { Transaction } from '../../js/model/Transaction.js';

/** CSS classes */
const POPUP_CONTENT_CLASS = 'chart-popup__content';
const POPUP_HEADER_CLASS = 'chart-popup__header';
const POPUP_LIST_CLASS = 'chart-popup-list';
const POPUP_LIST_ITEM_CLASS = 'chart-popup-list__item';
const POPUP_LIST_VALUE_CLASS = 'chart-popup-list__value';

/** Strings */
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

        this.groupTypes = [null, 'day', 'week', 'month', 'year'];

        this.props = {
            ...defaultProps,
            ...this.props,
        };

        this.state = {
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

        const accounts = asArray(this.state.filter.acc_id);
        if (this.state.filter.report === 'account' && accounts.length === 0) {
            const account = window.app.model.userAccounts.getItemByIndex(0);
            this.state.filter.acc_id = [account.id];
        }
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
            barWidth: 45,
            columnGap: 3,
            stacked: true,
            showPopup: true,
            activateOnHover: true,
            renderPopup: (target) => this.renderPopupContent(target),
        });

        this.histogram.elem.dataset.time = this.state.renderTime;

        this.loadingIndicator = LoadingIndicator.create();
        insertAfter(this.loadingIndicator.elem, chartElem);

        this.typeMenu = TransactionTypeMenu.fromElement(ge('type_menu'), {
            multiple: true,
            allowActiveLink: true,
            itemParam: 'type',
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        this.reportMenu = LinkMenu.fromElement(ge('report_menu'), {
            itemParam: 'report',
            onChange: (value) => this.onSelectReportType(value),
        });

        this.accountField = ge('acc_block');
        this.currencyField = ge('curr_block');

        this.currencyDropDown = DropDown.create({
            elem: 'curr_id',
            onitemselect: (obj) => this.onCurrencySel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initCurrencyList(this.currencyDropDown);

        this.accountDropDown = DropDown.create({
            elem: 'acc_id',
            multiple: true,
            placeholder: 'Select account',
            onitemselect: (obj) => this.onAccountSel(obj),
            onchange: (obj) => this.onAccountSel(obj),
            className: 'dd_fullwidth',
        });
        window.app.initAccountsList(this.accountDropDown);

        this.groupDropDown = DropDown.create({
            elem: 'groupsel',
            onitemselect: (obj) => this.onGroupSel(obj),
            className: 'dd_fullwidth',
        });

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(ge('dateFrm'), {
            startPlaceholder: START_DATE_PLACEHOLDER,
            endPlaceholder: END_DATE_PLACEHOLDER,
            onChange: (data) => this.onChangeDateFilter(data),
        });

        this.render(this.state);
        this.requestData(this.state.filter);
    }

    /** Set loading state and render view */
    startLoading() {
        this.setState({ ...this.state, loading: true });
    }

    /** Remove loading state and render view */
    stopLoading() {
        this.setState({ ...this.state, loading: false });
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
        if (this.state.filter.type === selected) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                type: selected,
            },
        });
        this.requestData(this.state.form);
    }

    /** Date range filter change handler */
    onChangeDateFilter(data) {
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                ...data,
            },
        });

        this.requestData(this.state.form);
    }

    /**
     * Report type select callback
     * @param {string} value - selected report type
     */
    onSelectReportType(value) {
        if (!value) {
            return;
        }

        const form = { ...this.state.form };
        if (value) {
            form.report = value;
        } else if ('report' in form) {
            delete form.report;
        }
        if (form.report === this.state.form.report) {
            return;
        }

        this.setState({ ...this.state, form });

        this.requestData(this.state.form);
    }

    isSameSelection(a, b) {
        return a.length === b.length && a.every((id) => b.includes(id));
    }

    /**
     * Account select callback
     * @param {object} obj - selected account item
     */
    onAccountSel(obj) {
        const data = asArray(obj);
        const ids = data.map((item) => parseInt(item.id, 10));
        const filterIds = this.state.form.acc_id ?? [];

        if (this.isSameSelection(ids, filterIds)) {
            return;
        }

        const account = window.app.model.userAccounts.getItem(ids[0]);

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                acc_id: ids,
            },
            accountCurrency: account?.curr_id ?? 0,
        });

        this.requestData(this.state.form);
    }

    /**
     * Currency select callback
     * @param {object} obj - selected currency item
     */
    onCurrencySel(obj) {
        if (!obj) {
            return;
        }
        if (this.state.form.curr_id === obj.id) {
            return;
        }
        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                curr_id: obj.id,
            },
        });

        this.requestData(this.state.form);
    }

    /**
     * Group select callback
     * @param {object} obj - selected group item
     */
    onGroupSel(obj) {
        if (!obj) {
            return;
        }

        const form = { ...this.state.form };
        const groupId = parseInt(obj.id, 10);
        const group = (groupId < this.groupTypes.length) ? this.groupTypes[groupId] : null;
        if (group) {
            form.group = group;
        } else if ('group' in form) {
            delete form.group;
        }
        if (form.group === this.state.form.group) {
            return;
        }

        this.setState({ ...this.state, form });

        this.requestData(this.state.form);
    }

    replaceHistory(state = this.state) {
        const url = this.getFilterURL(state);
        window.history.replaceState({}, PAGE_TITLE, url);
    }

    async requestData(options) {
        this.startLoading();

        try {
            const result = await API.transaction.statistics(options);

            this.setState({
                ...this.state,
                chartData: { ...result.data.histogram },
                filter: { ...result.data.filter },
                form: { ...result.data.filter },
                renderTime: Date.now(),
            });
        } catch (e) {
            window.app.createMessage(e.message, 'msg_error');

            this.setState({
                ...this.state,
                form: { ...this.state.filter },
            });
        }

        this.stopLoading();
    }

    formatItemValue(item) {
        return window.app.model.currency.formatCurrency(
            item.value,
            this.state.accountCurrency,
        );
    }

    renderPopupListItem(item) {
        return createElement('li', {
            props: { className: POPUP_LIST_ITEM_CLASS },
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

    renderAccountsFilter(state, prevState = {}) {
        const ids = state.form?.acc_id ?? [];
        const filterIds = prevState?.form?.acc_id ?? [];
        if (this.isSameSelection(ids, filterIds)) {
            return;
        }

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

        show(this.accountField, !isByCurrency);
        show(this.currencyField, isByCurrency);

        this.renderAccountsFilter(state, prevState);

        if (state.form.curr_id) {
            this.currencyDropDown.selectItem(state.form.curr_id);
        }

        const groupType = this.getGroupTypeByName(state.form.group);
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

        const noData = !state.chartData?.values?.length && !state.chartData?.series?.length;
        show(this.noDataMessage, noData);
        show(this.histogram.chartContainer, !noData);

        if (state.chartData) {
            this.histogram.setData(state.chartData);
        }
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
