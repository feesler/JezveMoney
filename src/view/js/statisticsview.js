/**
 * Statistics view
 */
function StatisticsView(props)
{
    StatisticsView.parent.constructor.apply(this, arguments);

    this.groupTypes = [null, 'day', 'week', 'month', 'year'];

    this.model = {
        selDateRange: null
    };
}


extend(StatisticsView, View);


/**
 * View initialization
 */
StatisticsView.prototype.onStart = function()
{
    this.histogram = Charts.createHistogram({
        data : chartData,
        container : 'chart',
        autoScale : true,
        onbarclick : this.onBarClick.bind(this),
        onscroll : this.onChartsScroll.bind(this),
        onbarover : this.onBarOver.bind(this),
        onbarout : this.onBarOut.bind(this)
    });

    this.filterTypeDropDown = DropDown.create({
        input_id : 'filter_type',
        onitemselect : this.onFilterSel.bind(this),
        editable : false
    });

    if (filterObj.filter == 'currency')
    {
        this.currencyDropDown = DropDown.create({
            input_id : 'curr_id',
            onitemselect : this.onCurrencySel.bind(this),
            editable : false
        });
    }
    else
    {
        this.accountDropDown = DropDown.create({
            input_id : 'acc_id',
            onitemselect : this.onAccountSel.bind(this),
            editable : false
        });
    }

    this.groupDropDown = DropDown.create({
        input_id : 'groupsel',
        onitemselect : this.onGroupSel.bind(this),
        editable : false
    });


    this.datePickerIconLink = ge('calendar_btn');
    if (this.datePickerIconLink)
    {
        this.datePickerIconLinkBtn = this.datePickerIconLink.querySelector('button');
        if (this.datePickerIconLinkBtn)
            this.datePickerIconLinkBtn.onclick = this.showCalendar.bind(this);
    }
    this.dateBlock = ge('date_block');
    this.datePickerWrapper = ge('calendar');

    this.dateInputBtn = ge('cal_rbtn');
    if (this.dateInputBtn)
        this.dateInputBtn.addEventListener('click', this.showCalendar.bind(this));
    this.dateInput = ge('date');
};


/**
 * Build new location address from current filterObj
 */
StatisticsView.prototype.buildAddress = function()
{
    var newLocation = baseURL + 'statistics/';
    var locFilter = {};

    setParam(locFilter, filterObj);

    for(var name in locFilter)
    {
        if (typeof locFilter[name] == 'string')
            locFilter[name] = encodeURIComponent(locFilter[name]);
    }

    if (!isEmpty(locFilter))
        newLocation += '?' + urlJoin(locFilter);

    return newLocation;
};


/**
 * Date range select calback
 * @param {Range} range - object with 'start' and 'end' date properties
 */
StatisticsView.prototype.onRangeSelect = function(range)
{
    if (!range || !isDate(range.start) || !isDate(range.end))
        return;

    this.selDateRange = range;

    this.dateInput.value = DatePicker.format(range.start) + ' - ' + DatePicker.format(range.end);
};


/**
 * Date picker hide callback
 */
StatisticsView.prototype.onDatePickerHide = function()
{
    if (!this.selDateRange)
        return;

    filterObj.stdate = DatePicker.format(this.selDateRange.start);
    filterObj.enddate = DatePicker.format(this.selDateRange.end);

    window.location = this.buildAddress();
};


/**
 * Show calendar block
 */
StatisticsView.prototype.showCalendar = function()
{
    if (!this.datePicker)
    {
        this.datePicker = DatePicker.create({
            wrapper_id : this.datePickerWrapper.id,
            relparent : this.datePickerWrapper.parentNode,
            range : true,
            onrangeselect : this.onRangeSelect.bind(this),
            onhide : this.onDatePickerHide.bind(this) });
    }
    if (!this.datePicker)
        return;

    this.datePicker.show(!this.datePicker.visible());

    show(this.datePickerIconLink, false);
    show(this.dateBlock, true);

    setEmptyClick(this.datePicker.hide.bind(this.datePicker), [
        this.datePickerWrapper,
        this.datePickerIconLink,
        this.dateInputBtn
    ]);
};


/**
 * Filter type select callback
 * @param {object} obj - selected filter type item
 */
StatisticsView.prototype.onFilterSel = function(obj)
{
    if (!obj)
        return;

    var filterType = (parseInt(obj.id) == 1) ? 'currency' : null;
    if (filterType)
        filterObj.filter = filterType;
    else if ('filter' in filterObj)
        delete filterObj['filter'];

    window.location = this.buildAddress();
};


/**
 * Account select callback
 * @param {object} obj - selected account item
 */
StatisticsView.prototype.onAccountSel = function(obj)
{
    if (!obj)
        return;

    filterObj.acc_id = obj.id;
    window.location = this.buildAddress();
};


/**
 * Currency select callback
 * @param {object} obj - selected currency item
 */
StatisticsView.prototype.onCurrencySel = function(obj)
{
    if (!obj)
        return;

    filterObj.curr_id = obj.id;
    window.location = this.buildAddress();
};


/**
 * Group select callback
 * @param {object} obj - selected group item
 */
StatisticsView.prototype.onGroupSel = function(obj)
{
    if (!obj)
        return;

    obj.id = parseInt(obj.id);
    var group = (obj.id < this.groupTypes.length) ? this.groupTypes[obj.id] : null;
    if (group)
        filterObj.group = group;
    else if ('group' in filterObj)
        delete filterObj['group'];

    window.location = this.buildAddress();
};


/**
 * Hide chart popup
 */
StatisticsView.prototype.hideChartPopup = function()
{
    if (!this.popup)
        return;

    show(this.popup, false);
    this.popup = null;

    setEmptyClick();
};


/**
 * Histogram scroll event handler
 */
StatisticsView.prototype.onChartsScroll = function()
{
    if (this.popup)
        this.hideChartPopup();
};


/**
 * Histogram bar click callback
 * @param {object} barRect - bar rectangle element
 * @param {number} val - value of selected bar
 */
StatisticsView.prototype.onBarClick = function(barRect, val)
{
    var isRelative = true;

    var chartsWrapper = this.histogram.getWrapObject();
    var chartContent = this.histogram.getContent();
    if (!chartsWrapper || !chartContent)
        return;

    if (!this.popup)
    {
        this.popup = ce('div', { className : 'chart_popup hidden' });
        chartsWrapper.appendChild(this.popup);
    }

    if (isVisible(this.popup))
    {
        this.hideChartPopup();
    }
    else
    {
        show(this.popup, true);

        chartsWrapper.style.position = (isRelative) ? 'relative' : '';

        this.popup.textContent = formatCurrency(val, accCurr);

        var rectBBox = barRect.getBBox();
        var chartsBRect = chartsWrapper.getBoundingClientRect();

        var popupX = rectBBox.x2 - chartContent.scrollLeft + 10;
        var popupY = e.clientY - chartsBRect.top - 10;

        if (this.popup.offsetWidth + popupX > chartsBRect.width)
            popupX -= popup.offsetWidth + rectBBox.width + 20;

        setParam(this.popup.style, { left : px(popupX), top : px(popupY) });

        setTimeout(setEmptyClick.bind(this, this.hideChartPopup.bind(this), [barRect[0]]));
    }
};


/**
 * Histogram bar mouse over callback
 * @param {object} bar 
 */
StatisticsView.prototype.onBarOver = function(bar)
{
    if (bar)
        bar.attr({ fill : '#00ffbf' });
};


/**
 * Histogram bar mouse out callback
 * @param {object} bar - bar rectangle element mouse leave from
 */
StatisticsView.prototype.onBarOut = function(bar)
{
    if (bar)
        bar.attr({ fill : '#00bfff' });
};
