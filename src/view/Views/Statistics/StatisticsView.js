import 'jezvejs/style';
import {
    ge,
    setEvents,
    isDate,
    show,
    urlJoin,
    isEmpty,
    formatDate,
    Histogram,
    DatePicker,
    DropDown,
} from 'jezvejs';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import { TransactionTypeMenu } from '../../Components/TransactionTypeMenu/TransactionTypeMenu.js';
import '../../css/app.scss';
import '../../Components/TransactionTypeMenu/style.scss';
import './style.scss';

/**
 * Statistics view
 */
class StatisticsView extends View {
    constructor(...args) {
        super(...args);

        if (
            !('accountCurrency' in this.props)
            || !('chartData' in this.props)
        ) {
            throw new Error('Invalid Statistics view properties');
        }

        this.groupTypes = [null, 'day', 'week', 'month', 'year'];

        this.state = {
            selDateRange: null,
            accountCurrency: this.props.accountCurrency,
            chartData: this.props.chartData,
        };

        this.state.filter = ('filter' in this.props) ? this.props.filter : {};
    }

    /**
     * View initialization
     */
    onStart() {
        this.histogram = Histogram.create({
            elem: 'chart',
            data: this.state.chartData,
            height: 320,
            marginTop: 35,
            scrollToEnd: true,
            autoScale: true,
            scrollThrottle: 100,
            showPopup: true,
            activateOnHover: true,
            renderPopup: (item) => this.renderPopupContent(item),
        });

        this.typeMenu = TransactionTypeMenu.fromElement(document.querySelector('.trtype-menu'), {
            allowActiveLink: true,
            onChange: (sel) => this.onChangeTypeFilter(sel),
        });

        this.filterTypeDropDown = DropDown.create({
            elem: 'filter_type',
            onitemselect: (obj) => this.onFilterSel(obj),
            editable: false,
            className: 'dd__fullwidth',
        });

        if (this.state.filter.filter === 'currency') {
            this.currencyDropDown = DropDown.create({
                elem: 'curr_id',
                onitemselect: (obj) => this.onCurrencySel(obj),
                editable: false,
                className: 'dd__fullwidth',
            });

            this.initCurrencyList(this.currencyDropDown);

            if (this.state.filter.curr_id) {
                this.currencyDropDown.selectItem(this.state.filter.curr_id);
            }
        } else {
            this.accountDropDown = DropDown.create({
                elem: 'acc_id',
                onitemselect: (obj) => this.onAccountSel(obj),
                editable: false,
                className: 'dd__fullwidth',
            });

            this.initAccountsList(this.accountDropDown);

            if (this.state.filter.acc_id) {
                this.accountDropDown.selectItem(this.state.filter.acc_id);
            }
        }

        this.groupDropDown = DropDown.create({
            elem: 'groupsel',
            onitemselect: (obj) => this.onGroupSel(obj),
            editable: false,
            className: 'dd__fullwidth',
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
    }

    /**
     * Build new location address from current filter object
     */
    buildAddress() {
        const { baseURL } = window.app;
        let newLocation = `${baseURL}statistics/`;
        const locFilter = { ...this.state.filter };

        if (!isEmpty(locFilter)) {
            newLocation += `?${urlJoin(locFilter)}`;
        }

        return newLocation;
    }

    /**
     * Transaction type menu change event handler
     */
    onChangeTypeFilter(selected) {
        this.state.filter.type = selected;
        window.location = this.buildAddress();
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
        const start = formatDate(range.start);
        const end = formatDate(range.end);

        this.dateInput.value = `${start} - ${end}`;
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        if (!this.selDateRange) {
            return;
        }

        this.state.filter.stdate = formatDate(this.selDateRange.start);
        this.state.filter.enddate = formatDate(this.selDateRange.end);

        window.location = this.buildAddress();
    }

    /**
     * Show calendar block
     */
    showCalendar() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                wrapper: this.datePickerWrapper,
                relparent: this.datePickerWrapper.parentNode,
                locales: 'en',
                range: true,
                onrangeselect: (range) => this.onRangeSelect(range),
                onhide: () => this.onDatePickerHide(),
            });
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

        delete this.state.filter.stdate;
        delete this.state.filter.enddate;
        window.location = this.buildAddress();
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

        window.location = this.buildAddress();
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
        window.location = this.buildAddress();
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
        window.location = this.buildAddress();
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

        window.location = this.buildAddress();
    }

    /** Returns content of chart popup for specified item */
    renderPopupContent(item) {
        if (!item) {
            return null;
        }

        return window.app.model.currency.formatCurrency(
            item.value,
            this.state.accountCurrency,
        );
    }
}

window.app = new Application(window.appProps);
window.app.createView(StatisticsView);
