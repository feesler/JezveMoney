var calendarObj = null;
var startDate = null, endDate = null;


// Return group parameter for specified type
function getGroupParam(id)
{
	if (id == 1)
		return '&group=day';
	else if (id == 2)
		return '&group=week';
	else if (id == 3)
		return '&group=month';
	else if (id == 4)
		return '&group=year';
	else
		return '';
}


// Return filter parameter for specified type
function getFilterParam(id)
{
	if (id == 1)
		return 'filter=currency';
	else
		return '';
}


// Filter type change event handler
function onFilterChange(obj)
{
	var filter_id, acc_id, group_id;
	var accsel, groupsel;
	var filter_type;

	accsel = ge('acc_id');
	groupsel = ge('groupsel');
	filter_type = ge('filter_type');
	if (!accsel || !groupsel || !filter_type)
		return;

	filter_id = parseInt(selectedValue(filter_type));
	acc_id = parseInt(selectedValue(accsel));
	group_id = parseInt(selectedValue(groupsel))

	show('acc_block', (filter_id == 0));
	show('curr_block', (filter_id == 1));

	window.location = './statistics.php?' + getFilterParam(filter_id) + '&type=' + transType + getGroupParam(group_id);
}


// Group change event handler
function onGroupChange(obj)
{
	var newLocation;
	var filter_id, acc_id, curr_id, group_id;
	var accsel, currsel, groupsel;
	var filter_type;

	accsel = ge('acc_id');
	currsel = ge('curr_id');
	groupsel = ge('groupsel');
	filter_type = ge('filter_type');
	if (!accsel || !groupsel || !filter_type)
		return;

	filter_id = parseInt(selectedValue(filter_type));
	acc_id = parseInt(selectedValue(accsel));
	curr_id = parseInt(selectedValue(currsel));
	group_id = parseInt(selectedValue(groupsel))

	newLocation = './statistics.php?' + getFilterParam(filter_id);
	if (filter_id == 1)
		newLocation += '&curr_id=' + curr_id;
	else
		newLocation += '&acc_id=' + acc_id;
	newLocation += '&type=' + transType + getGroupParam(group_id);

	window.location = newLocation;
}


// Account change event handler
function onAccountChange()
{
	var acc_id, group_id;
	var accsel, groupsel;

	accsel = ge('acc_id');
	groupsel = ge('groupsel');
	if (!accsel || !groupsel)
		return;

	acc_id = parseInt(selectedValue(accsel));
	group_id = parseInt(selectedValue(groupsel));

	window.location = './statistics.php?acc_id=' + acc_id + '&type=' + transType + getGroupParam(group_id);
}


// Currency change event handler
function onCurrChange()
{
	var filter_id, curr_id, group_id;
	var currsel, groupsel;
	var filter_type;

	currsel = ge('curr_id');
	groupsel = ge('groupsel');
	filter_type = ge('filter_type');
	if (!currsel || !groupsel || !filter_type)
		return;

	filter_id = parseInt(selectedValue(filter_type));
	curr_id = parseInt(selectedValue(currsel));
	group_id = parseInt(selectedValue(groupsel));

	window.location = './statistics.php?' + getFilterParam(filter_id) + '&curr_id=' + curr_id + '&type=' + transType + getGroupParam(group_id);
}


// Return maximum value from array
function getMax(arrObj)
{
	var res;

	if (!arrObj || !arrObj.length)
		return null;

	res = arrObj[0];
	arrObj.forEach(function(val)
	{
		res = Math.max(res, val);
	});

	return res;
}


// Return function to convert relative value to absolute
function convertRelToAbs(maxVal, absMaxVal)
{
	return function(val)
	{
		return absMaxVal * (val / maxVal);
	}
}


var r, lr = null;
var paperHeight = 300;
var vLabelsWidth = 10;
var barMargin = 10;
var barWidth;
var chartOffset;
var chartContentWidth;



// Save total width of chart block with labels
function getChartOffset()
{
	var chart;

	chart = ge('chart');
	if (!chart || !chart.parentNode || !chart.parentNode.parentNode || !chart.parentNode.parentNode.parentNode)
		return;

	chartOffset = chart.parentNode.parentNode.parentNode.offsetWidth;
}


// Update width of chart block
function updateChartWidth()
{
	var paperWidth;

	if (!r)
		return;

	getChartOffset();
	paperWidth = Math.max(chartOffset - vLabelsWidth, chartContentWidth);

	r.setSize(paperWidth, paperHeight);
}


// Set new width for vertical labels block and SVG object
function setVertLabelsWidth(width)
{
	var chart, dw;

	chart = ge('chart');
	if (!lr || !chart)
		return;

	dw = vLabelsWidth - width;

	lr.setSize(width, paperHeight + 20);
	vLabelsWidth = width;

	updateChartWidth();
}


// Create bar chart
function initBarChart(fitToWidth, heightSet)
{
	var chart, vert_labels, barRect, gridPath;
	var maxVal;
	var leftPos = 0, relHeight, barHeight;
	var hLabelsHeight = 20;
	var chartWidth, chartHeight;
	var dashed, gridY, valStep, gridStepRatio, gridStep;
	var getHeight;
	var txtEl, bbObj, steps;
	var chartMarginTop = 10;

	chart = ge('chart');
	vert_labels = ge('vert_labels');
	if (!chart || !vert_labels || !chartData)
		return;

	paperHeight = heightSet || paperHeight;

	chartHeight = paperHeight - hLabelsHeight - chartMarginTop;
	maxVal = getMax(chartData[0]);
	getHeight = convertRelToAbs(maxVal, chartHeight);

	fitToWidth = fitToWidth || false;
	if (fitToWidth)
		barWidth = (chart.offsetWidth / chartData[0].length) - barMargin;
	else
		barWidth = 38;

	chartContentWidth = (chartData[0].length + 1) * (barWidth + barMargin);
	chartWidth = Math.max(chart.offsetWidth, chartContentWidth);

	r = Raphael('chart', chartWidth, paperHeight);
	lr = Raphael('vert_labels', vLabelsWidth, paperHeight + 20);

	// create grid
	dashed = { fill : 'none', stroke : '#808080', 'stroke-dasharray' : '- '};

	// calculate vertical grid step
	valStep = 5;
	while((maxVal / valStep) > 1)
	{
		valStep *= 10;
	}

	gridStepRatio = Math.floor(chartHeight / 50);

	while((maxVal / valStep) < gridStepRatio)
	{
		valStep /= 2;
	}

	// calculate y of first grid line
	gridY = getHeight(maxVal % valStep) + chartMarginTop;

	// calculate absolute grid step
	steps = Math.floor(maxVal / valStep);
	gridStep = (chartHeight - gridY + chartMarginTop) / steps;

	// calculate first label value
	val = maxVal - (maxVal % valStep);

	for(var i = 0; i <= steps; i++)
	{
		r.path('M0,' + Math.round(gridY) + '.5L' + chartWidth + ',' + Math.round(gridY) + '.5').attr(dashed);

		txtEl = lr.text(5, Math.round(gridY), val).attr({ 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' });

		bbObj = txtEl.getBBox();
		if (bbObj.width + 10 > vLabelsWidth)
			setVertLabelsWidth(bbObj.width + 10);

		val -= valStep;

		gridY += gridStep;
	}

	// create bars
	chartData[0].forEach(function(val)
	{
		barHeight = getHeight(val);

		barRect = r.rect(leftPos, chartHeight - barHeight + chartMarginTop, barWidth, barHeight);
		barRect.attr({ fill : "#00bfff", 'fill-opacity' : 1, stroke : 'none' });

		barRect.mouseover(function()
		{
			this.attr({ fill : '#00ffbf' });
		});

		barRect.mouseout(function()
		{
			this.attr({ fill : '#00bfff' });
		});

		barRect.click(bind(onBarClick, barRect, val));

		leftPos += barWidth + barMargin;
	});


	// create horizontal labels
	labelShift = 0;
	prevCount = 0;
	itemsInGroup = 0;
	chartData[1].forEach(function(val, itemNum)
	{
		itemDate = val[0];
		itemsCount = val[1];

		if ((itemsInGroup % 3) == 0 || prevCount > 1)
		{
			r.text(labelShift, paperHeight - (hLabelsHeight / 2), itemDate).attr({ 'font-family' : 'Segoe UI', 'font-size' : 14, 'text-anchor' : 'start' });
			itemsInGroup = 0;
		}
		labelShift += itemsCount * (barWidth + barMargin);
		prevCount = itemsCount;
		itemsInGroup++;
	});
}


// Hide usem menu popup
function hideChartPopup()
{
	show('chpopup', false);
	setEmptyClick();
}


// Show/hide chart popup by click
function onBarClick(val)
{
	var isRelative = true;
	var popupX, popupY;
	var rectBBox, chartsBRect;
	var popup, charts, chart, chartContent;

	popup = ge('chpopup');
	chart = ge('chart');
	if (!popup || !chart)
		return;

	charts = popup.parentNode;
	chartContent = chart.parentNode;
	if (!charts || !chartContent)
		return;

	if (isVisible(popup))
	{
		hideChartPopup();
	}
	else
	{
		show(popup, true);

		e = fixEvent(event);

		charts.style.position = (isRelative) ? 'relative' : '';

		popup.innerHTML = formatCurrency(val, accCurr);

		rectBBox = this.getBBox();
		chartsBRect = charts.getBoundingClientRect();

		chartContent.onscroll = hideChartPopup;

		popupX = rectBBox.x2 - chartContent.scrollLeft + 10;
		popupY = e.clientY - chartsBRect.top - 10;

		if (popup.offsetWidth + popupX > chartsBRect.width)
			popupX -= popup.offsetWidth + rectBBox.width + 20;

		popup.style.left = px(popupX);
		popup.style.top = px(popupY);

		setEmptyClick(hideChartPopup, [this[0]]);
	}
}


// TODO : check duplication with tr_list.js
// Create calendar object
function buildCalendar(callback)
{
	var today = new Date();

	return createCalendar(today.getDate(), today.getMonth(), today.getFullYear(), callback);
}


// Hide calendar block
function hideCalendar()
{
	show('calendar', false);
}


// Start date select callback
function onSelectStartDate(date, month, year)
{
	var datefield;

	datefield = ge('date');
	if (!datefield)
		return;

	startDate = new Date(year, month, date);

	if (startDate && endDate)
	{
		hideCalendar();
		datefield.value = formatDate(startDate) + ' - ' + formatDate(endDate);

		newLocation = './transactions.php?type=' + transType;
		if (acc_id != 0)
			newLocation += '&acc_id=' + curAccId;
		if (searchRequest)
			newLocation += '&search=' + encodeURI(searchRequest);
		newLocation += '&stdate=' + formatDate(startDate) + '&enddate=' + formatDate(endDate);

		window.location = newLocation;
	}
}


// End date select callback
function onSelectEndDate(date, month, year)
{
	var datefield;

	datefield = ge('date');
	if (!datefield)
		return;

	endDate = new Date(year, month, date);

	if (startDate && endDate)
	{
		hideCalendar();
		datefield.value = formatDate(startDate) + ' - ' + formatDate(endDate);

		newLocation = './transactions.php?type=' + transType;
		if (acc_id != 0)
			newLocation += '&acc_id=' + curAccId;
		if (searchRequest)
			newLocation += '&search=' + encodeURI(searchRequest);
		newLocation += '&stdate=' + formatDate(startDate) + '&enddate=' + formatDate(endDate);

		window.location = newLocation;
	}
}


// Show calendar block
function showCalendar()
{
	if (!calendarObj)
	{
		calendarObj = ge('calendar');
		if (!calendarObj)
			return;

		var cal1, cal2;

		cal1 = ce('div', {}, [ buildCalendar(onSelectStartDate) ]);
		cal2 = ce('div', {}, [ buildCalendar(onSelectEndDate) ]);

		calendarObj.appendChild(cal1);
		calendarObj.appendChild(cal2);
	}

	show(calendarObj, !isVisible(calendarObj));
	show('calendar_btn', false);
	show('date_block', true);

	setEmptyClick(hideCalendar, ['calendar', 'calendar_btn', 'cal_rbtn']);
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

	onGroupChange();
}


// Initialization of page controls
function initControls()
{
	var isMobile;
	var filterDD, accCurrDD, groupDD;

	isMobile = (document.documentElement.clientWidth < 700);

	filterDD = new DDList();
	if (!filterDD.create({ input_id : 'filter_type', itemPrefix : 'filter', selCB : onFilterSel, editable : false, mobile : isMobile }))
		filterDD = null;

	accCurrDD = new DDList();
	if (filterByCurr)
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
	if (!groupDD.create({ input_id : 'groupsel', itemPrefix : 'filter', selCB : onGroupSel, editable : false, mobile : isMobile }))
		groupDD = null;

}
