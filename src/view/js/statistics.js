var calendarObj = null;
var selRange = null;


// Build new location address from current filterObj
function buildAddress()
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
}


// Date range select calback
function onRangeSelect(range)
{
	var datefield;

	if (!range || !isDate(range.start) || !isDate(range.end))
		return;

	datefield = ge('date');
	if (!datefield)
		return;

	selRange = range;

	datefield.value = DatePicker.format(range.start) + ' - ' + DatePicker.format(range.end);
}


// Date picker hide callback
function onDatePickerHide()
{
	if (!selRange)
		return;

	filterObj.stdate = DatePicker.format(selRange.start);
	filterObj.enddate = DatePicker.format(selRange.end);

	window.location = buildAddress();
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = DatePicker.create({ wrapper_id : 'calendar',
										relparent : ge('calendar').parentNode,
										range : true,
										onrangeselect : onRangeSelect,
										onhide : onDatePickerHide });
		if (!calendarObj)
			return;
	}

	self.calendarObj.show(!self.calendarObj.visible());

	show('calendar_btn', false);
	show('date_block', true);

	setEmptyClick(self.calendarObj.hide.bind(self.calendarObj), ['calendar', 'calendar_btn', 'cal_rbtn']);
}


// Filter type select callback
function onFilterSel(obj)
{
	var filter;

	if (!obj)
		return;

	this.setText(obj.str);

	filter = (parseInt(obj.id) == 1) ? 'currency' : null;
	if (filter)
		filterObj.filter = filter;
	else if ('filter' in filterObj)
		delete filterObj['filter'];

	window.location = buildAddress();
}


// Account select callback
function onAccountSel(obj)
{
	if (!obj)
		return;

	this.setText(obj.str);

	filterObj.acc_id = obj.id;
	window.location = buildAddress();
}


// Currency select callback
function onCurrencySel(obj)
{
	if (!obj)
		return;

	this.setText(obj.str);

	filterObj.curr_id = obj.id;
	window.location = buildAddress();
}


// Group select callback
function onGroupSel(obj)
{
	var groupTypes = [null, 'day', 'week', 'month', 'year'];
	var group;

	if (!obj)
		return;

	this.setText(obj.str);

	obj.id = parseInt(obj.id);
	group = (obj.id < groupTypes.length) ? groupTypes[obj.id] : null;
	if (group)
		filterObj.group = group;
	else if ('group' in filterObj)
		delete filterObj['group'];

	window.location = buildAddress();
}



// Hide chart popup
function hideChartPopup()
{
	if (!this.popup)
		return;

	show(this.popup, false);
	this.popup = null;

	setEmptyClick();
}


// Histogram scroll callback
function onChartsScroll()
{
	if (this.popup)
		hideChartPopup.call(this);
}


// Histogram bar click callback
function onBarClick(barRect, val)
{
	var isRelative = true;
	var popupX, popupY;
	var rectBBox, chartsBRect;
	var chartContent, chartsWrapObj;

	chartsWrapObj = this.getWrapObject();
	chartContent = this.getContent();
	if (!chartsWrapObj || !chartContent)
		return;

	if (!this.popup)
	{
		this.popup = ce('div', { className : 'chart_popup', style : { display : 'none' } });
		chartsWrapObj.appendChild(this.popup);
	}

	if (isVisible(this.popup))
	{
		hideChartPopup.call(this);
	}
	else
	{
		show(this.popup, true);

		e = fixEvent(event);

		chartsWrapObj.style.position = (isRelative) ? 'relative' : '';

		this.popup.innerHTML = formatCurrency(val, accCurr);

		rectBBox = barRect.getBBox();
		chartsBRect = chartsWrapObj.getBoundingClientRect();

		popupX = rectBBox.x2 - chartContent.scrollLeft + 10;
		popupY = e.clientY - chartsBRect.top - 10;

		if (this.popup.offsetWidth + popupX > chartsBRect.width)
			popupX -= popup.offsetWidth + rectBBox.width + 20;

		setParam(this.popup.style, { left : px(popupX), top : px(popupY) });

		schedule(setEmptyClick.bind(this, hideChartPopup.bind(this), [barRect[0]]))();
	}
}


// Histogram bar mouse over callback
function onBarOver(bar)
{
	if (bar)
		bar.attr({ fill : '#00ffbf' });
}


// Histogram bar mouse out callback
function onBarOut(bar)
{
	if (bar)
		bar.attr({ fill : '#00bfff' });
}


// Initialization of page controls
function initControls()
{
	Charts.createHistogram({ data : chartData, container : 'chart', autoScale : true,
							onbarclick : onBarClick, onscroll : onChartsScroll,
							onbarover : onBarOver, onbarout : onBarOut });

	DropDown.create({ input_id : 'filter_type', onitemselect : onFilterSel, editable : false });
	if (filterObj.filter == 'currency')
	{
		DropDown.create({ input_id : 'curr_id', onitemselect : onCurrencySel, editable : false });
	}
	else
	{
		DropDown.create({ input_id : 'acc_id', onitemselect : onAccountSel, editable : false });
	}

	DropDown.create({ input_id : 'groupsel', onitemselect : onGroupSel, editable : false });

	var btn;
	var calendar_btn = ge('calendar_btn');
	if (calendar_btn)
	{
		btn = calendar_btn.firstElementChild;
		if (btn)
			btn.onclick = showCalendar;
	}

	btn = ge('cal_rbtn');
	if (btn)
		btn.onclick = showCalendar;
}
