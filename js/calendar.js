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
function getDayCell(date, month, year, callback)
{
	var td, btn;

	if (!callback)
		return null;

	td = ce('td');
	if (!td)
		return null;

	btn = ce('button', { type : 'button',
					innerHTML : date,
					onclick : callback.bind(null, date, month, year) });
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


function getMonthBtn(obj, month, year, callback, isPrev)
{
	return ce('button', { className : 'pnMonthBtn',
					type : 'button',
					onclick  : schedule(updateCalendar.bind(null, obj, month, year, callback)) },
					[ ce('div', { className : isPrev ? 'prev' : 'next' }) ]);
}


function updateCalendar(obj, month, year, callback)
{
	var calObj;

	if (!obj)
		return;

	calObj = createCalendar(1, month, year, callback);
	if (!calObj)
		return;

	insertAfter(calObj, obj);
	if (obj.parentNode)
		obj.parentNode.removeChild(obj);
}


function createCalendar(date, month, year, dayCallback)
{
	var mainTable, tbody, tr, td;
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


	if (!dayCallback)
		return null;

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

	mainTable = ce('table', { className : 'calTbl' });
	if (!mainTable)
		return;

	tbody = ce('tbody');
	if (!tbody)
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
								ce('tbody', {},
										[
											ce('tr', {},
													[
														ce('td', { className : 'pnMonth' }, [ getMonthBtn(mainTable, prevMonth.month, prevMonth.year, dayCallback, true) ]),
														ce('td', { className : 'hMonth', innerHTML : months[rMonth] + ' ' + rYear }),
														ce('td', {}, [ getMonthBtn(mainTable, nextMonth.month, nextMonth.year, dayCallback, false) ])
													])
										])
							]);

	td.appendChild(headTbl);

	tr.appendChild(td);
	tbody.appendChild(tr);


	// week days
	tr = ce('tr');
	if (!tr)
		return;
	weekdays.forEach(function(wd){
		tr.appendChild(ce('td', { innerHTML : wd }));
	});
	tbody.appendChild(tr);

	tr = ce('tr');
	if (!tr)
		return;

	// days of previous month
	daysInRow = 0;
	pMonthDays = getDaysInMonth(prevMonth.month, prevMonth.year);
	for(i = 1; i < dayOfWeek; i++)
	{
		dayCell = getDayCell((pMonthDays - (dayOfWeek - i) + 1), prevMonth.month, prevMonth.year, dayCallback);
		if (!dayCell)
			return;
		dayCell.className = 'omonth';
		tr.appendChild(dayCell);
		daysInRow++;
	}

	// days of current month
	for(i = 1; i < daysInMonth + 1; i++)
	{
		dayCell = getDayCell(i, rMonth, rYear, dayCallback);
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
				tbody.appendChild(tr);
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
			dayCell = getDayCell(i - daysInRow + 1, nextMonth.month, nextMonth.year, dayCallback);
			if (!dayCell)
				return;
			dayCell.className = 'omonth';
			tr.appendChild(dayCell);
		}

		tbody.appendChild(tr);
	}

	mainTable.appendChild(tbody);

	return mainTable;
}


// Format date as DD.MM.YYYY
function formatDate(date, month, year)
{
	if (isDate(date) && !month && !year)
	{
		month = date.getMonth();
		year = date.getFullYear();
		date = date.getDate();
	}

	return ((date > 9) ? '' : '0') + date + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year;
}
