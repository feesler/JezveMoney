import 'jezvejs/style';
import {
    ge,
    ce,
    isDate,
    isVisible,
    show,
    setParam,
    setEmptyClick,
    removeEmptyClick,
    urlJoin,
    px,
    isEmpty,
} from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { Histogram } from 'jezvejs/Histogram';
import { DatePicker } from 'jezvejs/DatePicker';
import { DropDown } from 'jezvejs/DropDown';
import { Application } from '../../js/Application.js';
import { View } from '../../js/View.js';
import { IconLink } from '../../Components/IconLink/IconLink.js';
import '../../css/app.css';
import '../../Components/TransactionTypeMenu/style.css';
import './style.css';

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

        this.emptyClickHandler = () => this.hideChartPopup();

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
            autoScale: true,
            onitemclick: (e, rect) => this.onBarClick(e, rect),
            onscroll: () => this.onChartsScroll(),
            onitemover: (e, bar) => this.onBarOver(e, bar),
            onitemout: (e, bar) => this.onBarOut(e, bar),
        });

        this.filterTypeDropDown = DropDown.create({
            input_id: 'filter_type',
            onitemselect: (obj) => this.onFilterSel(obj),
            editable: false,
            className: 'dd__fullwidth',
        });

        if (this.state.filter.filter === 'currency') {
            this.currencyDropDown = DropDown.create({
                input_id: 'curr_id',
                onitemselect: (obj) => this.onCurrencySel(obj),
                editable: false,
                className: 'dd__fullwidth',
            });
        } else {
            this.accountDropDown = DropDown.create({
                input_id: 'acc_id',
                onitemselect: (obj) => this.onAccountSel(obj),
                editable: false,
                className: 'dd__fullwidth',
            });
        }

        this.groupDropDown = DropDown.create({
            input_id: 'groupsel',
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
     * Date range select calback
     * @param {Range} range - object with 'start' and 'end' date properties
     */
    onRangeSelect(range) {
        if (!range || !isDate(range.start) || !isDate(range.end)) {
            return;
        }

        this.selDateRange = range;
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

    /**
     * Hide chart popup
     */
    hideChartPopup() {
        if (!this.popup) {
            return;
        }

        show(this.popup, false);
        this.popup = null;

        removeEmptyClick(this.emptyClickHandler);
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

            this.popup.textContent = window.app.model.currency.formatCurrency(
                barRect.value,
                this.state.accountCurrency,
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
                () => setEmptyClick(this.emptyClickHandler, [barRect.elem, this.popup]),
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

window.app = new Application(window.appProps);
window.app.createView(StatisticsView);
