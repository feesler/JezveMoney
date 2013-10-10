var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


var mdays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Check specified year is leap
function isLeap(year)
{
	return ((year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0)));
}


// Return count of days in specified month
function getDaysInMonth(month, year)
{
	if (month == 1 && isLeap(year))
		return mdays[month] + 1;
	else
		return mdays[month];
}


// Return cell object for specified date
function getDayCell(date, month, year)
{
	var td, btn;

	td = ce('td');
	if (!td)
		return null;

	btn = ce('button', { type : 'button',
					innerHTML : date,
					onclick : bind(onSelectDate, null, date, month, year) });
	if (!btn)
		return null;

	td.appendChild(btn);

	return td;
}


// Return { month, year } object for previous month
function getPrevMonth(month, year)
{
	return { year : (month == 0) ? year - 1 : year,
			month : (month == 0) ? 11 : month - 1 };
}


// Return { month, year } object for next month
function getNextMonth(month, year)
{
	return { month : (month == 11) ? 0 : month + 1,
			year : (month == 11) ? year + 1 : year };
}


function getMonthBtn(month, year, isPrev)
{
	return ce('button', { className : 'pnMonthBtn',
					type : 'button',
//					onclick  : bind(createCalendar, null, 1, month, year) }, [ ce('div', { className : isPrev ? 'prev' : 'next' }) ]);
					onclick  : schedule(bind(createCalendar, null, 1, month, year)) }, [ ce('div', { className : isPrev ? 'prev' : 'next' }) ]);
}


function createCalendar(date, month, year)
{
	var calDiv;
	var mainTable, thead, tr, td;
	var i, daysInRow;
	var daysInWeek = 7;
	var daysInMonth;
	var day, rMonth, rYear, rDate;
	var firstDay, dayOfWeek;

	var prevMonth, nextMonth;
	var pMonthDays;
	var dayCell;

	var today = new Date();
	var tMonth = today.getMonth();
	var tYear = today.getFullYear();
	var tDate = today.getDate();

	// get real date from specified
	day = new Date(year, month, date);
	rMonth = day.getMonth();
	rYear = day.getFullYear();
	rDate = day.getDate();

	daysInMonth = getDaysInMonth(rMonth, rYear);

	// week day of first day in month
	firstDay = new Date(rYear, rMonth, 1);
	dayOfWeek = firstDay.getDay();
	if (dayOfWeek == 0)	// fix first day of week is sunday
		dayOfWeek = 7;

	calDiv = ge('calendar');
	if (!calDiv)
		return;

	mainTable = ce('table', { className : 'calTbl' });
	if (!mainTable)
		return;

	thead = ce('thead');
	if (!thead)
		return;

	// month name
	tr = ce('tr');
	if (!tr)
		return;
	td = ce('td', { colSpan : daysInWeek });
	if (!td)
		return;

	prevMonth = getPrevMonth(rMonth, rYear);
	nextMonth = getNextMonth(rMonth, rYear);

	var headTbl = ce('table', { className : 'calHeadTbl' },
							[
								ce('thead', {},
										[
											ce('tr', {},
													[
														ce('td', { className : 'pnMonth' }, [ getMonthBtn(prevMonth.month, prevMonth.year, true) ]),
														ce('td', { className : 'hMonth', innerHTML : months[rMonth] + ' ' + rYear }),
														ce('td', {}, [ getMonthBtn(nextMonth.month, nextMonth.year, false) ])
													])
										])
							]);

	td.appendChild(headTbl);

	tr.appendChild(td);
	thead.appendChild(tr);


	// week days
	tr = ce('tr');
	if (!tr)
		return;
	weekdays.forEach(function(wd){
		tr.appendChild(ce('td', { innerHTML : wd }));
	});
	thead.appendChild(tr);

	tr = ce('tr');
	if (!tr)
		return;

	// days of previous month
	daysInRow = 0;
	pMonthDays = getDaysInMonth(prevMonth.month, prevMonth.year);
	for(i = 1; i < dayOfWeek; i++)
	{
		dayCell = getDayCell((pMonthDays - (dayOfWeek - i) + 1), prevMonth.month, prevMonth.year);
		if (!dayCell)
			return;
		dayCell.className = 'omonth';
		tr.appendChild(dayCell);
		daysInRow++;
	}

	// days of current month
	for(i = 1; i < daysInMonth + 1; i++)
	{
		dayCell = getDayCell(i, rMonth, rYear);
		if (!dayCell)
			return;

		if (i == tDate && tMonth == rMonth && tYear == rYear)
			dayCell.className = 'today';

		tr.appendChild(dayCell);
		daysInRow++;
		if (daysInRow == daysInWeek)		// check new week
		{
			if (tr != null)
			{
				thead.appendChild(tr);
				tr = null;
			}

			tr = ce('tr');
			if (!tr)
				return;
			daysInRow = 0;
		}
	}

	if (tr != null)
	{
		// append days of next month
		for(i = daysInRow; i < daysInWeek; i++)
		{
			dayCell = getDayCell(i - daysInRow + 1, nextMonth.month, nextMonth.year);
			if (!dayCell)
				return;
			dayCell.className = 'omonth';
			tr.appendChild(dayCell);
		}

		thead.appendChild(tr);
	}

	mainTable.appendChild(thead);

	removeChilds(calDiv);

	calDiv.appendChild(mainTable);
}


function buildCalendar()
{
	var today = new Date();

	createCalendar(today.getDate(), today.getMonth(), today.getFullYear());
}


// Format date as DD.MM.YYYY
function formatDate(date, month, year)
{
	return ((date > 9) ? '' : '0') + date + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year
}


// Date select callback
function onSelectDate(date, month, year)
{
	var datefield;

	datefield = ge('date');
	if (!datefield)
		return;

	datefield.value = formatDate(date, month, year);

	hideCalendar();
}


// Hide calendar block
function hideCalendar()
{
	show('calendar', false);
//	show('date_block', false);
//	setCalendarIconLink(true);
}


// Remove element from DOM and return
function re(obj)
{
	var robj = ge(obj);

	return robj ? robj.parentNode.removeChild(robj) : null;
}


// Set calendar iconlink to idle/active state
function setCalendarIconLink(idle)
{
	var calendar_btn, date_block, iconlinkText;

	date_block = ge('date_block');
	calendar_btn = re('calendar_btn');
	if (!date_block || !calendar_btn)
		return;

	idle = idle || false;

	iconlinkText = calendar_btn.firstElementChild.firstElementChild.nextElementSibling;

	if (idle)
	{
		date_block.parentNode.insertBefore(calendar_btn, date_block);
		show(iconlinkText, true);
	}
	else
	{
		date_block.firstElementChild.nextElementSibling.firstElementChild.appendChild(calendar_btn);
		show(iconlinkText, false);
	}
}


// Show calendar block
function showCalendar()
{
	var date_block, calendar;

	date_block = ge('date_block');
	calendar = ge('calendar');
	if (!date_block || !calendar)
		return;

	show(calendar, (calendar.style.display == 'none'));
	show(date_block, true);

	setCalendarIconLink(false);

	setEmptyClick(hideCalendar, ['calendar', 'calendar_btn']);
}
