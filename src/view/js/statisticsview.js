'use strict';

/* global ge, ce, isDate, isVisible, show, setParam, setEmptyClick, urlJoin, px, extend, View */
/* global isEmpty, baseURL, CurrencyList, Histogram, DatePicker, DropDown, IconLink */

/**
 * Statistics view
 */
function StatisticsView() {
    StatisticsView.parent.constructor.apply(this, arguments);

    if (
        !('currency' in this.props)
        || !('accountCurrency' in this.props)
        || !('chartData' in this.props)
    ) {
        throw new Error('Invalid Statistics view properties');
    }

    this.groupTypes = [null, 'day', 'week', 'month', 'year'];

    this.model = {
        selDateRange: null,
        accountCurrency: this.props.accountCurrency,
        chartData: this.props.chartData
    };

    this.model.currency = CurrencyList.create(this.props.currency);
    this.model.filter = ('filter' in this.props) ? this.props.filter : {};
}

extend(StatisticsView, View);

/**
 * View initialization
 */
StatisticsView.prototype.onStart = function () {
    this.histogram = Histogram.create({
        elem: 'chart',
        data: this.model.chartData,
        autoScale: true,
        onitemclick: this.onBarClick.bind(this),
        onscroll: this.onChartsScroll.bind(this),
        onitemover: this.onBarOver.bind(this),
        onitemout: this.onBarOut.bind(this)
    });

    this.filterTypeDropDown = DropDown.create({
        input_id: 'filter_type',
        onitemselect: this.onFilterSel.bind(this),
        editable: false
    });

    if (this.model.filter.filter === 'currency') {
        this.currencyDropDown = DropDown.create({
            input_id: 'curr_id',
            onitemselect: this.onCurrencySel.bind(this),
            editable: false
        });
    } else {
        this.accountDropDown = DropDown.create({
            input_id: 'acc_id',
            onitemselect: this.onAccountSel.bind(this),
            editable: false
        });
    }

    this.groupDropDown = DropDown.create({
        input_id: 'groupsel',
        onitemselect: this.onGroupSel.bind(this),
        editable: false
    });

    this.datePickerBtn = IconLink.fromElement({
        elem: 'calendar_btn',
        onclick: this.showCalendar.bind(this)
    });
    this.dateBlock = ge('date_block');
    this.datePickerWrapper = ge('calendar');

    this.dateInputBtn = ge('cal_rbtn');
    if (this.dateInputBtn) {
        this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
    }
    this.dateInput = ge('date');
};

/**
 * Build new location address from current filter object
 */
StatisticsView.prototype.buildAddress = function () {
    var newLocation = baseURL + 'statistics/';
    var locFilter = {};

    setParam(locFilter, this.model.filter);

    if (!isEmpty(locFilter)) {
        newLocation += '?' + urlJoin(locFilter);
    }

    return newLocation;
};

/**
 * Date range select calback
 * @param {Range} range - object with 'start' and 'end' date properties
 */
StatisticsView.prototype.onRangeSelect = function (range) {
    if (!range || !isDate(range.start) || !isDate(range.end)) {
        return;
    }

    this.selDateRange = range;

    this.dateInput.value = DatePicker.format(range.start) + ' - ' + DatePicker.format(range.end);
};

/**
 * Date picker hide callback
 */
StatisticsView.prototype.onDatePickerHide = function () {
    if (!this.selDateRange) {
        return;
    }

    this.model.filter.stdate = DatePicker.format(this.selDateRange.start);
    this.model.filter.enddate = DatePicker.format(this.selDateRange.end);

    window.location = this.buildAddress();
};

/**
 * Show calendar block
 */
StatisticsView.prototype.showCalendar = function () {
    if (!this.datePicker) {
        this.datePicker = DatePicker.create({
            wrapper: this.datePickerWrapper,
            relparent: this.datePickerWrapper.parentNode,
            range: true,
            onrangeselect: this.onRangeSelect.bind(this),
            onhide: this.onDatePickerHide.bind(this)
        });
    }
    if (!this.datePicker) {
        return;
    }

    this.datePicker.show(!this.datePicker.visible());

    this.datePickerBtn.hide();
    show(this.dateBlock, true);

    setEmptyClick(this.datePicker.hide.bind(this.datePicker), [
        this.datePickerWrapper,
        this.datePickerBtn.elem,
        this.dateInputBtn
    ]);
};

/**
 * Filter type select callback
 * @param {object} obj - selected filter type item
 */
StatisticsView.prototype.onFilterSel = function (obj) {
    var filterType;

    if (!obj) {
        return;
    }

    filterType = (parseInt(obj.id, 10) === 1) ? 'currency' : null;
    if (filterType) {
        this.model.filter.filter = filterType;
    } else if ('filter' in this.model.filter) {
        delete this.model.filter.filter;
    }

    window.location = this.buildAddress();
};

/**
 * Account select callback
 * @param {object} obj - selected account item
 */
StatisticsView.prototype.onAccountSel = function (obj) {
    if (!obj) {
        return;
    }

    this.model.filter.acc_id = obj.id;
    window.location = this.buildAddress();
};

/**
 * Currency select callback
 * @param {object} obj - selected currency item
 */
StatisticsView.prototype.onCurrencySel = function (obj) {
    if (!obj) {
        return;
    }

    this.model.filter.curr_id = obj.id;
    window.location = this.buildAddress();
};

/**
 * Group select callback
 * @param {object} obj - selected group item
 */
StatisticsView.prototype.onGroupSel = function (obj) {
    var group;
    var groupId;

    if (!obj) {
        return;
    }

    groupId = parseInt(obj.id, 10);
    group = (groupId < this.groupTypes.length) ? this.groupTypes[groupId] : null;
    if (group) {
        this.model.filter.group = group;
    } else if ('group' in this.model.filter) {
        delete this.model.filter.group;
    }

    window.location = this.buildAddress();
};

/**
 * Hide chart popup
 */
StatisticsView.prototype.hideChartPopup = function () {
    if (!this.popup) {
        return;
    }

    show(this.popup, false);
    this.popup = null;

    setEmptyClick();
};

/**
 * Histogram scroll event handler
 */
StatisticsView.prototype.onChartsScroll = function () {
    if (this.popup) {
        this.hideChartPopup();
    }
};

/**
 * Histogram bar click callback
 * @param {object} barRect - bar rectangle element
 * @param {number} val - value of selected bar
 */
StatisticsView.prototype.onBarClick = function (e, barRect, val) {
    var chartsWrapper;
    var chartContent;
    var rectBBox;
    var chartsBRect;
    var popupX;
    var popupY;
    var isRelative = true;

    chartsWrapper = this.histogram.getWrapObject();
    chartContent = this.histogram.getContent();
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

        chartsWrapper.style.position = (isRelative) ? 'relative' : '';

        this.popup.textContent = this.model.currency.formatCurrency(
            val,
            this.model.accountCurrency
        );

        rectBBox = barRect.getBBox();
        chartsBRect = chartsWrapper.getBoundingClientRect();
        popupX = rectBBox.x2 - chartContent.scrollLeft + 10;
        popupY = e.clientY - chartsBRect.top - 10;

        if (this.popup.offsetWidth + popupX > chartsBRect.width) {
            popupX -= this.popup.offsetWidth + rectBBox.width + 20;
        }

        setParam(this.popup.style, { left: px(popupX), top: px(popupY) });

        setTimeout(setEmptyClick.bind(this, this.hideChartPopup.bind(this), [barRect[0]]));
    }
};

/**
 * Histogram bar mouse over callback
 * @param {object} bar
 */
StatisticsView.prototype.onBarOver = function (e, bar) {
    if (bar) {
        bar.setAttribute('fill', '#00ffbf');
    }
};

/**
 * Histogram bar mouse out callback
 * @param {object} bar - bar rectangle element mouse leave from
 */
StatisticsView.prototype.onBarOut = function (e, bar) {
    if (bar) {
        bar.setAttribute('fill', '#00bfff');
    }
};
