// Calendar constructor
var Calendar = (function()
{
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


	// Check specified year is leap
	function isLeap(year)
	{
		return ((year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0)));
	}


	// Return count of days in specified month
	function getDaysInMonth(date)
	{
		var date = new Date(date.getFullYear(), date.getMonth() + 1, 0);

		return date.getDate();
	}


	// Return fixed(0 is monday) day of week of specified date
	// Values if fixed: 0 is monday, 6 is sunday
	function getDayOfWeek(date)
	{
		if (!isDate(date))
			return null;

		var res = date.getDay();

		return (res) ? (res - 1) : 6;
	}


	// Return cell object for specified date
	function getDayCell(date, callback)
	{
		var td, btn;

		if (!isDate(date) || !callback)
			return null;

		td = ce('td');
		if (!td)
			return null;

		btn = ce('button', { type : 'button',
						innerHTML : date.getDate(),
						onclick : callback.bind(null, date) });
		if (!btn)
			return null;

		td.appendChild(btn);

		return td;
	}


	// Create button for previous / next month navigation
	function getMonthBtn(obj, date, callback, monthCallback, isPrev)
	{
		if (!obj || !isDate(date))
			return null;

		return ce('button', { className : 'pnMonthBtn',
						type : 'button',
						onclick  : schedule(monthCallback.bind(null, obj, date, callback)) },
						[ ce('div', { className : isPrev ? 'prev' : 'next' }) ]);
	}


	// Create date picker table
	function createCalendar(date, dayCallback, monthCallback)
	{
		var mainTable, headTbl, tbody, tr, td;
		var i, daysInRow;
		var daysInWeek = 7;
		var daysInMonth;
		var rMonth, rYear, rDate;
		var dayOfWeek;

		var prevMonth, nextMonth;
		var prevMonthBtn, nextMonthBtn;
		var pMonthDays;
		var dayCell;

		var d, today = new Date();
		today.setHours(0, 0, 0, 0);

		var daysSet = [];


		if (!isDate(date) || !dayCallback)
			return null;

		// get real date from specified
		rMonth = date.getMonth();
		rYear = date.getFullYear();
		rDate = date.getDate();

		daysInMonth = getDaysInMonth(date);

		// week day of first day in month
		dayOfWeek = getDayOfWeek(new Date(rYear, rMonth, 1));

		mainTable = ce('table', { className : 'calTbl' });


		prevMonth = new Date(rYear, rMonth - 1, 1);
		nextMonth = new Date(rYear, rMonth + 1, 1);

		// Create header table
		prevMonthBtn = getMonthBtn(mainTable, prevMonth, dayCallback, monthCallback, true);
		nextMonthBtn = getMonthBtn(mainTable, nextMonth, dayCallback, monthCallback, false);

		headTbl = ce('table', { className : 'calHeadTbl' });
		tbody = ce('tbody', {}, [ ce('tr', {}, [ ce('td', { className : 'pnMonth' }, [ prevMonthBtn ]),
										ce('td', { className : 'hMonth', innerHTML : months[rMonth] + ' ' + rYear }),
										ce('td', {}, [ nextMonthBtn ]) ]) ]);
		headTbl.appendChild(tbody);

		// Main table start
		tbody = ce('tbody');

		// Header
		tr = ce('tr', {}, [ ce('td', { colSpan : daysInWeek }, [ headTbl ]) ]);
		tbody.appendChild(tr);

		// week days
		tr = ce('tr');
		weekdays.forEach(function(wd){
			tr.appendChild(ce('td', { innerHTML : wd }));
		});
		tbody.appendChild(tr);

		// Calendar
		tr = ce('tr');

		// days of previous month
		daysInRow = 0;
		pMonthDays = getDaysInMonth(prevMonth);
		for(i = 1; i <= dayOfWeek; i++)
		{
			d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), pMonthDays - (dayOfWeek - i));
			dayCell = getDayCell(d, dayCallback);
			if (!dayCell)
				return;
			dayCell.className = 'omonth';
			tr.appendChild(dayCell);
			daysInRow++;

			daysSet.push({ date : d, cell : dayCell });
		}

		// days of current month
		for(i = 1; i < daysInMonth + 1; i++)
		{
			d = new Date(rYear, rMonth, i);
			dayCell = getDayCell(d, dayCallback);
			if (!dayCell)
				return;

			if (d - today == 0)
				dayCell.className = 'today';

			daysSet.push({ date : d, cell : dayCell });

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
				daysInRow = 0;
			}
		}

		if (tr != null)
		{
			// append days of next month
			for(i = daysInRow; i < daysInWeek; i++)
			{
				d = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i - daysInRow + 1);
				dayCell = getDayCell(d, dayCallback);
				if (!dayCell)
					return;
				dayCell.className = 'omonth';
				tr.appendChild(dayCell);

				daysSet.push({ date : d, cell : dayCell });
			}
	
			tbody.appendChild(tr);
		}

		mainTable.appendChild(tbody);

		return { table : mainTable, set : daysSet };
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


	// Check specified date is in range
	function inRange(date, range)
	{
		if (!isDate(date) || !range || !isDate(range.start) || !isDate(range.end))
			return false;

		return (date - range.start >= 0 && date - range.end <= 0);
	}


	// Date picker instance constructor
	function datePicker(params)
	{
		var datePickerObj = null;
		var wrapperObj = null;
		var dateCallback = null;
		var rangeCallback = null;
		var showCallback = null;
		var hideCallback = null;
		var dateSet = null;
		var actDate = null;
		var rangeMode = false;
		var curRange = { start : null, end : null };
		var selRange = { start : null, end : null };
		var self = this;


		// Remove highlight from all cells
		function cleanHL()
		{
			if (dateSet)
			{
				dateSet.forEach(function(dateObj)
				{
					removeClass(dateObj.cell, 'hl');
				});
			}
		}


		// Remove all markers from all cells
		function cleanAll()
		{
			if (dateSet)
			{
				dateSet.forEach(function(dateObj)
				{
					removeClass(dateObj.cell, ['hl', 'act']);
				});
			}
		}


		// Highlight specified range of cells
		function highLightRange(range)
		{
			if (!range || !range.start || !range.end)
				return;

			dateSet.forEach(function(dateObj)
			{
				if (inRange(dateObj.date, range))
				{
					addClass(dateObj.cell, 'hl');
				}
			});
		}


		// Activate cell by specified date
		function activateCell(date)
		{
			var cell;

			cell = findCell(date);
			if (cell)
			{
				if (!hasClass(cell, 'act'))
					addClass(cell, 'act');
			}
		}


		// Find cell element by date
		function findCell(date)
		{
			var cell = null;

			if (!isDate(date) || !dateSet)
				return null;

			dateSet.some(function(dateObj)
			{
				var cond = (dateObj.date - date == 0)
				if (cond)
					cell = dateObj.cell;

				return cond;
			});

			return cell;
		}


		// Day cell click inner callback
		function onDayClick(date)
		{
			actDate = date;
			activateCell(actDate);

			if (dateCallback)
				dateCallback(date);

			if (rangeMode)
				onRangeSelect(date);
		}


		// Range select inner callback
		function onRangeSelect(date)
		{
			cleanHL();

			curRange = { start : null, end : null }
			if (!selRange.start)
				selRange.start = date;
			else
				selRange.end = date;

			// Check swap in needed
			if (selRange.start - selRange.end > 0)
			{
				var tdate = selRange.end;
				selRange.end = selRange.start;
				selRange.start = tdate;
			}

			if (rangeCallback && selRange.start && selRange.end)
			{
				curRange = { start : selRange.start, end : selRange.end };
				selRange = { start : null, end : null };

				cleanAll();
				highLightRange(curRange);

				rangeCallback(curRange);
			}
		}


		// Month change callback
		function update(tblObj, date, callback)
		{
			var calObj;

			if (!tblObj || !isDate(date))
				return;

			calObj = createCalendar(date, callback, update);
			if (!calObj)
				return;

			insertAfter(calObj.table, tblObj);
			re(tblObj);

			dateSet = calObj.set;

			activateCell(actDate);

			if (rangeMode)
				highLightRange(curRange);
		}


		// Date picker instance
		function create(params)
		{
			var date;

			if (params.wrapper_id)
			{
				wrapperObj = ge(params.wrapper_id);
				if (!wrapperObj)
					return;
			}

			if (params.range == true && params.onrangeselect)
			{
				rangeMode = true;
				rangeCallback = params.onrangeselect;
			}
			dateCallback = params.ondateselect;

			showCallback = params.onshow || null;
			hideCallback = params.onhide || null;

			// Prepare date
			date = isDate(params.date) ? params.date : new Date();

			datePickerObj = createCalendar(date, onDayClick, update);
			if (!datePickerObj)
				return;

			if (wrapperObj)
				wrapperObj.appendChild(datePickerObj.table);

			dateSet = datePickerObj.set;
		}

		create(params);


		// public methods of date picker instance

		// Show/hide date picker
		this.show = function(val)
		{
			if (val === undefined)
				val = true;

			show(wrapperObj, val);

			if (val && showCallback)
				showCallback();
			if (!val && hideCallback)
				hideCallback();
		}


		// Hide date picker
		this.hide = function()
		{
			this.show(false);
		}


		// Check date picker is visible
		this.visible = function()
		{
			return isVisible(wrapperObj);
		}
	}


	// Calendar global object
	return {
		create : function(params)
		{
			return new datePicker(params);
		},


		format : function(date, month, year)
		{
			return formatDate(date, month, year);
		}
	}
})();
