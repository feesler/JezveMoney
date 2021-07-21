import {
    ge,
    ce,
    isDate,
    isVisible,
    show,
    setParam,
    setEmptyClick,
    urlJoin,
    px,
    isEmpty,
    Histogram,
    DatePicker,
    DropDown,
} from 'jezvejs';
import { View } from '../../js/View.js';
import { CurrencyList } from '../../js/model/CurrencyList.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/common.css';
import '../../css/app.css';
import '../../Components/TransactionTypeMenu/style.css';
import './style.css';

/* global baseURL */

/**
 * Statistics view
 */
class StatisticsView extends View {
    constructor(...args) {
        super(...args);

        if (!('currency' in this.props)
            || !('accountCurrency' in this.props)
            || !('chartData' in this.props)) {
            throw new Error('Invalid Statistics view properties');
        }

        this.groupTypes = [null, 'day', 'week', 'month', 'year'];

        this.model = {
            selDateRange: null,
            accountCurrency: this.props.accountCurrency,
            chartData: this.props.chartData,
        };

        this.model.currency = CurrencyList.create(this.props.currency);
        this.model.filter = ('filter' in this.props) ? this.props.filter : {};
    }

    /**
     * View initialization
     */
    onStart() {
        this.histogram = Histogram.create({
            elem: 'chart',
            data: this.model.chartData,
            autoScale: true,
            onitemclick: this.onBarClick.bind(this),
            onscroll: this.onChartsScroll.bind(this),
            onitemover: this.onBarOver.bind(this),
            onitemout: this.onBarOut.bind(this),
        });

        this.filterTypeDropDown = DropDown.create({
            input_id: 'filter_type',
            onitemselect: this.onFilterSel.bind(this),
            editable: false,
            extraClass: 'dd__fullwidth',
        });

        if (this.model.filter.filter === 'currency') {
            this.currencyDropDown = DropDown.create({
                input_id: 'curr_id',
                onitemselect: this.onCurrencySel.bind(this),
                editable: false,
                extraClass: 'dd__fullwidth',
            });
        } else {
            this.accountDropDown = DropDown.create({
                input_id: 'acc_id',
                onitemselect: this.onAccountSel.bind(this),
                editable: false,
                extraClass: 'dd__fullwidth',
            });
        }

        this.groupDropDown = DropDown.create({
            input_id: 'groupsel',
            onitemselect: this.onGroupSel.bind(this),
            editable: false,
            extraClass: 'dd__fullwidth',
        });

        this.datePickerBtn = IconLink.fromElement({
            elem: 'calendar_btn',
            onclick: () => this.showCalendar(),
        });
        this.dateBlock = ge('date_block');
        this.datePickerWrapper = ge('calendar');

        this.dateInputBtn = ge('cal_rbtn');
        if (this.dateInputBtn) {
            this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
        }
        this.dateInput = ge('date');
    }

    /**
     * Build new location address from current filter object
     */
    buildAddress() {
        let newLocation = `${baseURL}statistics/`;
        const locFilter = { ...this.model.filter };

        if (!isEmpty(locFilter)) {
            newLocation += `?${urlJoin(locFilter)}`;
        }

        return newLocation;
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
        const start = DatePicker.format(range.start);
        const end = DatePicker.format(range.end);

        this.dateInput.value = `${start} - ${end}`;
    }

    /**
     * Date picker hide callback
     */
    onDatePickerHide() {
        if (!this.selDateRange) {
            return;
        }

        this.model.filter.stdate = DatePicker.format(this.selDateRange.start);
        this.model.filter.enddate = DatePicker.format(this.selDateRange.end);

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

        setEmptyClick(() => this.datePicker.hide(), [
            this.datePickerWrapper,
            this.datePickerBtn.elem,
            this.dateInputBtn,
        ]);
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
            this.model.filter.filter = filterType;
        } else if ('filter' in this.model.filter) {
            delete this.model.filter.filter;
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

        this.model.filter.acc_id = obj.id;
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

        this.model.filter.curr_id = obj.id;
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
            this.model.filter.group = group;
        } else if ('group' in this.model.filter) {
            delete this.model.filter.group;
        }

        window.location = this.buildAddress();
    }

    /**
     * Hide chart popup
     */
    hideChartPopup() {
        if (!this.popup) {
            return;
        }

        show(this.popup, false);
        this.popup = null;

        setEmptyClick();
    }

    /**
     * Histogram scroll event handler
     */
    onChartsScroll() {
        if (this.popup) {
            this.hideChartPopup();
        }
    }

    /**
     * Histogram bar click callback
     * @param {object} barRect - bar rectangle element
     */
    onBarClick(e, barRect) {
        const chartsWrapper = this.histogram.getWrapObject();
        const chartContent = this.histogram.getContent();
        if (!chartsWrapper || !chartContent) {
            return;
        }

        if (!this.popup) {
            this.popup = ce('div', { className: 'chart_popup hidden' });
            chartsWrapper.appendChild(this.popup);
        }

        if (isVisible(this.popup)) {
            this.hideChartPopup();
        } else {
            show(this.popup, true);

            chartsWrapper.style.position = 'relative';

            this.popup.textContent = this.model.currency.formatCurrency(
                barRect.value,
                this.model.accountCurrency,
            );

            const rectBBox = barRect.elem.getBBox();
            const chartsBRect = chartContent.getBoundingClientRect();
            let popupX = rectBBox.x - chartContent.scrollLeft
                + (rectBBox.width - this.popup.offsetWidth) / 2;
            const popupY = rectBBox.y - this.popup.offsetHeight - 10;

            if (popupX < 0) {
                popupX = 0;
            }
            if (this.popup.offsetWidth + popupX > chartsBRect.width) {
                popupX -= this.popup.offsetWidth + rectBBox.width + 20;
            }

            setParam(this.popup.style, { left: px(popupX), top: px(popupY) });

            setTimeout(
                () => setEmptyClick(() => this.hideChartPopup(), [barRect.elem, this.popup]),
            );
        }
    }

    /**
     * Histogram bar mouse over callback
     * @param {object} bar
     */
    onBarOver(e, bar) {
        if (!bar || !bar.elem) {
            return;
        }

        bar.elem.classList.add('bar_active');
    }

    /**
     * Histogram bar mouse out callback
     * @param {object} bar - bar rectangle element mouse leave from
     */
    onBarOut(e, bar) {
        if (!bar || !bar.elem) {
            return;
        }

        bar.elem.classList.remove('bar_active');
    }
}

window.view = new StatisticsView(window.app);
