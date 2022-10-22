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
import { DateRangeInput } from '../../Components/DateRangeInput/DateRangeInput.js';
import { LoadingIndicator } from '../../Components/LoadingIndicator/LoadingIndicator.js';
import '../../Components/TransactionTypeMenu/style.scss';
import './style.scss';

/** CSS classes */
const POPUP_LIST_CLASS = 'chart-popup-list';
const POPUP_LIST_ITEM_CLASS = 'chart-popup-list__item';
const POPUP_LIST_VALUE_CLASS = 'chart-popup-list__value';

/** Strings */
const PAGE_TITLE = 'Jezve Money | Statistics';

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

        this.linkMenu = LinkMenu.fromElement(ge('type_menu'), {
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

        // Date range filter
        this.dateRangeFilter = DateRangeInput.fromElement(ge('dateFrm'), {
            onChange: (data) => this.onChangeDateFilter(data),
        });

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

    /**
     * Account select callback
     * @param {object} obj - selected account item
     */
    onAccountSel(obj) {
        if (!obj) {
            return;
        }
        if (this.state.form.acc_id === obj.id) {
            return;
        }

        this.setState({
            ...this.state,
            form: {
                ...this.state.form,
                acc_id: obj.id,
            },
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

    /** Returns content of chart popup for specified target */
    renderPopupContent(target) {
        if (!target) {
            return null;
        }

        const items = target.group ?? [target.item];
        const elems = items.map((item) => createElement('li', {
            props: { className: POPUP_LIST_ITEM_CLASS },
            children: createElement('span', {
                props: {
                    className: POPUP_LIST_VALUE_CLASS,
                    textContent: this.formatItemValue(item),
                },
            }),
        }));

        return createElement('ul', {
            props: { className: POPUP_LIST_CLASS },
            children: elems,
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

        this.linkMenu.setURL(filterUrl);
        const types = asArray(state.form.type).map((type) => type.toString());
        this.linkMenu.setSelection(types);

        const isByCurrency = (state.form.report === 'currency');
        this.reportMenu.setActive(state.form.report);

        show(this.accountField, !isByCurrency);
        show(this.currencyField, isByCurrency);

        if (state.form.acc_id) {
            this.accountDropDown.selectItem(state.form.acc_id);
        }
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
