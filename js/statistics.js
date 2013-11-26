var calendarObj = null;
var startDate = null, endDate = null;


// Return group parameter for specifyed type
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


// Group change event handler
function onGroupChange(obj)
{
	var acc_id, group_id;
	var accsel, groupsel;

	accsel = ge('acc_id');
	groupsel = ge('groupsel');
	if (!accsel || !groupsel)
		return;

	acc_id = parseInt(selectedValue(accsel));
	group_id = parseInt(selectedValue(groupsel))

	window.location = './statistics.php?acc_id=' + acc_id + '&type=' + transType + getGroupParam(group_id);
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
		return Math.round(absMaxVal * (val / maxVal));
	}
}


// Create bar chart
function initBarChart(fitToWidth)
{
	var chart, r, barRect, gridPath;
	var maxVal;
	var leftPos = 0, relHeight, barWidth, barHeight;
	var barMargin = 10;
	var chartWidth, chartHeight = 300;
	var dashed, gridY, gridStep;
	var getHeight;

	chart = ge('chart');
	if (!chart || !chartData)
		return;

	maxVal = getMax(chartData);
	getHeight = convertRelToAbs(maxVal, chartHeight);

	fitToWidth = fitToWidth || false;
	if (fitToWidth)
		barWidth = (chart.offsetWidth / chartData.length) - barMargin;
	else
		barWidth = 38;

	chartWidth = chartData.length * (barWidth + barMargin);

	chart.style.width = chartWidth + 'px';

	r = Raphael('chart', chartWidth, chartHeight);

	// create grid
	dashed = { fill : 'none', stroke : '#000000', 'stroke-dasharray' : '- '};

	// calculate vertical grid step
	gridStep = 5;
	while((maxVal / gridStep) > 1)
		gridStep *= 10;

	while((maxVal / gridStep) < 5)
		gridStep /= 2;

	// calculate y of first grid line
	gridY = getHeight(maxVal % gridStep);

	// calculate absolute grid step
	gridStep = getHeight(gridStep);

	while(gridY < chartHeight)
	{
		r.path('M0,' + gridY + '.5L' + chartWidth + ',' + gridY + '.5').attr(dashed);
		gridY += gridStep;
	}

	// create bars
	chartData.forEach(function(val)
	{
		barHeight = getHeight(val);

		barRect = r.rect(leftPos, chartHeight - barHeight, barWidth, barHeight);
		barRect.attr({fill : "#00bfff", 'fill-opacity' : 1, stroke : 'none' });

		barRect.mouseover(function()
		{
			this.attr({fill : '#00ffbf'});
		});

		barRect.mouseout(function()
		{
			this.attr({fill : '#00bfff'});
		});

		leftPos += barWidth + barMargin;
	});
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
