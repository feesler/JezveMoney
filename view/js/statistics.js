var calendarObj = null;
var selRange = null;
var baseURL = 'http://jezve.net/money/';


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


// Return group parameter for specified type
function getGroupParam(id)
{
	var groupTypes = [null, 'day', 'week', 'month', 'year'];

	id = parseInt(id);

	return (id < groupTypes.length) ? groupTypes[id] : null;
}


// Return filter parameter for specified type
function getFilterParam(id)
{
	return (parseInt(id) == 1) ? 'currency' : null;
}


// Filter type change event handler
function onFilterChange(obj)
{
	var filter;

	filter = getFilterParam(selectedValue(obj));
	if (filter)
		filterObj.filter = filter;
	else if ('filter' in filterObj)
		delete filterObj['filter'];

	window.location = buildAddress();
}


// Group change event handler
function onGroupChange(obj)
{
	var group;

	group = getGroupParam(selectedValue(obj));
	if (group)
		filterObj.group = group;
	else if ('group' in filterObj)
		delete filterObj['group'];

	window.location = buildAddress();
}


// Account change event handler
function onAccountChange(obj)
{
	filterObj.acc_id = parseInt(selectedValue(obj));

	window.location = buildAddress();
}


// Currency change event handler
function onCurrChange(obj)
{
	filterObj.curr_id = parseInt(selectedValue(obj));

	window.location = buildAddress();
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

	datefield.value = Calendar.format(range.start) + ' - ' + Calendar.format(range.end);
}


// Date picker hide callback
function onDatePickerHide()
{
	if (!selRange)
		return;

	filterObj.stdate = Calendar.format(selRange.start);
	filterObj.enddate = Calendar.format(selRange.end);

	window.location = buildAddress();
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = Calendar.create({ wrapper_id : 'calendar',
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
	var filter_type;

	if (!obj)
		return;
	filter_type = ge('filter_type');
	if (!filter_type)
		return;

	selectByValue(filter_type, obj.id);

	this.setText(obj.str);

	onFilterChange(filter_type);
}


// Account select callback
function onAccountSel(obj)
{
	var acc_id;

	if (!obj)
		return;
	acc_id = ge('acc_id');
	if (!acc_id)
		return;

	selectByValue(acc_id, obj.id);

	this.setText(obj.str);

	onAccountChange(acc_id);
}


// Currency select callback
function onCurrencySel(obj)
{
	var curr_id;

	if (!obj)
		return;
	curr_id = ge('curr_id');
	if (!curr_id)
		return;

	selectByValue(curr_id, obj.id);

	this.setText(obj.str);

	onCurrChange(curr_id);
}


// Group select callback
function onGroupSel(obj)
{
	var groupsel;

	if (!obj)
		return;
	groupsel = ge('groupsel');
	if (!groupsel)
		return;

	selectByValue(groupsel, obj.id);

	this.setText(obj.str);

	onGroupChange(groupsel);
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
	var isMobile;
	var filterDD, accCurrDD, groupDD;

	isMobile = (document.documentElement.clientWidth < 700);

	Charts.createHistogram({ data : chartData, container : 'chart', autoScale : true,
							onbarclick : onBarClick, onscroll : onChartsScroll,
							onbarover : onBarOver, onbarout : onBarOut });

	filterDD = new DDList();
	if (!filterDD.create({ input_id : 'filter_type', itemPrefix : 'filter', selCB : onFilterSel, editable : false, mobile : isMobile }))
		filterDD = null;

	accCurrDD = new DDList();
	if (filterObj.filter == 'currency')
	{
		if (!accCurrDD.create({ input_id : 'curr_id', itemPrefix : 'curr', selCB : onCurrencySel, editable : false, mobile : isMobile }))
			accCurrDD = null;
	}
	else
	{
		if (!accCurrDD.create({ input_id : 'acc_id', itemPrefix : 'acc', selCB : onAccountSel, editable : false, mobile : isMobile }))
			accCurrDD = null;
	}

	groupDD = new DDList();
	if (!groupDD.create({ input_id : 'groupsel', itemPrefix : 'group', selCB : onGroupSel, editable : false, mobile : isMobile }))
		groupDD = null;

}
