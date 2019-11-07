// Calendar constructor
var Calendar = new (function()
{
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	var MONTH_VIEW = 1, YEAR_VIEW = 2, YEARRANGE_VIEW = 3;


	// Fix value for CSS transform
	function toFix(val)
	{
		return +val.toFixed(4);
	}


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


	// Create month picker table
	function createYearRangeView(date)
	{
		var yearsPerRow = 4, rangeLength = 10;
		var setObj;

		if (!isDate(date))
			return null;

		var res = { type : YEARRANGE_VIEW, set : [], viewDate : date };

		// get real date from specified
		var rYear = date.getFullYear();
		var startYear = rYear - (rYear % 10) - 1;

		res.title = (startYear + 1) + '-' + (startYear + rangeLength);
		res.cellsTable = ce('table');

		// Create header table
		res.nav = { prev : new Date(rYear - rangeLength, 1, 1),
					next : new Date(rYear + rangeLength, 1, 1) };

		// Main table start
		var tbody = ce('tbody');

		// years of current range
		var tr = ce('tr');
		for(var i = 0; i < rangeLength + 2; i++)
		{
			setObj = { date : new Date(startYear + i, 0, 1) };
			setObj.cell = ce('td', { className : 'yearCell', innerHTML : setObj.date.getFullYear() });
			if (i == 0 || i == rangeLength + 1)
				setObj.cell.classList.add('omonth');

			res.set.push(setObj);
			tr.appendChild(setObj.cell);
			if ((i + 1) % yearsPerRow == 0)		// check new row
			{
				tbody.appendChild(tr);
				if (i == rangeLength + 1)
					break;
				tr = ce('tr');
			}
		}

		res.cellsTable.appendChild(tbody);

		return res;
	}


	// Create month picker table
	function createYearView(date)
	{
		var monthsPerRow = 4;
		var setObj;

		if (!isDate(date))
			return null;

		var res = { type : YEAR_VIEW, set : [], viewDate : date };

		// get real date from specified
		var rYear = date.getFullYear();

		res.title = rYear;
		res.cellsTable = ce('table');

		// Create header table
		res.nav = { prev : new Date(rYear - 1, 1, 1),
					next : new Date(rYear + 1, 1, 1) };

		// Main table start
		var tbody = ce('tbody');

		// months of current year
		var tr = ce('tr');
		for(var i = 0; i < months.length; i++)
		{
			setObj = { date : new Date(rYear, i, 1) };
			setObj.cell = ce('td', { className : 'monthCell', innerHTML : months[setObj.date.getMonth()].substr(0, 3) });

			res.set.push(setObj);
			tr.appendChild(setObj.cell);
			if ((i + 1) % monthsPerRow == 0)		// check new row
			{
				tbody.appendChild(tr);
				if (i == months.length - 1)
					break;
				tr = ce('tr');
			}
		}

		res.cellsTable.appendChild(tbody);

		return res;
	}


	// Create date picker table
	function createMonthView(date)
	{
		var setObj;
		var daysInWeek = 7;

		if (!isDate(date))
			return null;

		var res = { type : MONTH_VIEW, set : [], viewDate : date };

		var today = new Date();
		today.setHours(0, 0, 0, 0);

		// get real date from specified
		var rMonth = date.getMonth();
		var rYear = date.getFullYear();

		var daysInMonth = getDaysInMonth(date);

		res.title = months[rMonth] + ' ' + rYear;
		res.cellsTable = ce('table');

		res.nav = { prev : new Date(rYear, rMonth - 1, 1),
					next : new Date(rYear, rMonth + 1, 1) };

		// Main table start
		var tbody = ce('tbody');

		// week days
		var tr = ce('tr');
		weekdays.forEach(function(wd){
			tr.appendChild(ce('th', { innerHTML : wd }));
		});
		tbody.appendChild(tr);

		// Calendar
		tr = ce('tr');

		// days of previous month
		var pMonthDays = getDaysInMonth(res.nav.prev);
		var dayOfWeek = getDayOfWeek(new Date(rYear, rMonth, 1));		// week day of first day in month
		var i, daysInRow = dayOfWeek;
		for(i = 1; i <= dayOfWeek; i++)
		{
			setObj = { date : new Date(res.nav.prev.getFullYear(), res.nav.prev.getMonth(), pMonthDays - (dayOfWeek - i)) };
			setObj.cell = ce('td', { innerHTML : setObj.date.getDate() });
			setObj.cell.className = 'omonth';

			res.set.push(setObj);
			tr.appendChild(setObj.cell);
		}

		// days of current month
		for(i = 1; i < daysInMonth + 1; i++)
		{
			setObj = { date : new Date(rYear, rMonth, i) };
			setObj.cell = ce('td', { innerHTML : setObj.date.getDate() });
			if (setObj.date - today == 0)
				setObj.cell.className = 'today';

			res.set.push(setObj);
			tr.appendChild(setObj.cell);
			if (++daysInRow == daysInWeek)		// check new week
			{
				tbody.appendChild(tr);
				tr = ce('tr');
				daysInRow = 0;
			}
		}

		// append days of next month
		for(i = daysInRow; i < daysInWeek; i++)
		{
			setObj = { date : new Date(res.nav.next.getFullYear(), res.nav.next.getMonth(), i - daysInRow + 1) };
			setObj.cell = ce('td', { innerHTML : setObj.date.getDate() });
			setObj.cell.className = 'omonth';

			res.set.push(setObj);
			tr.appendChild(setObj.cell);
		}

		tbody.appendChild(tr);
		res.cellsTable.appendChild(tbody);

		return res;
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
		var baseObj = null;
		var wrapperObj = null;
		var isStatic = false;
		var relativeParent = null;
		var dateCallback = null;
		var rangeCallback = null;
		var showCallback = null;
		var hideCallback = null;
		var currView = null;
		var nextView = null;
		var nextCallbacks = null;
		var actDate = null;
		var rangeMode = false;
		var curRange = { start : null, end : null };
		var selRange = { start : null, end : null };
		var titleEl = null;
		var cellsContainer = null;
		var isAnimated = true;
		var animation = false;
		var self = this;


		function renderHead()
		{
			titleEl = ce('span', { className : 'title' });

			var headTbl = ce('div', { className : 'calHeadTbl' }, [
								ce('div', { className : 'nav next' }, ce('div')),
								ce('div', { className : 'nav prev' }, ce('div')),
								ce('div', {}, titleEl) ]);

			return headTbl;
		}


		function setTitle(title)
		{
			if (title && titleEl)
				titleEl.innerHTML = title;
		}


		// Mouse whell event handler
		function onWheel(e)
		{
			var dir;

			if (!currView || !currView.callback || animation)
				return;

			e = fixEvent(e);

			if (!e.wheelDelta)	// Firefox
				e.wheelDelta = -40*e.detail;

			if (e.wheelDelta == 0)
				return;

			dir = (e.wheelDelta > 0);

			if (!isFunction(currView.callback.nav) || !currView.nav)
				return;

			schedule(currView.callback.nav.bind(null, dir ? currView.nav.prev : currView.nav.next))();

			e.preventDefault ? e.preventDefault() : (e.returnValue = false);
		}


		// Wheel support initialization
		function initWheel(elem, handler)
		{
			if (!elem)
				return;

			if (elem.addEventListener)
			{
				elem.addEventListener("mousewheel", handler, false);			// IE9+, Opera, Chrome/Safari
				elem.addEventListener("DOMMouseScroll", handler, false);		// Firefox
			}
			else		// IE<9
				elem.attachEvent("onmousewheel", handler);
		}


		// Table click event delegate
		function onTableClick(e)
		{
			if (!currView || !currView.callback || animation)
				return;

			e = fixEvent(e);

			if (e.target.classList.contains('title') || e.target.parentNode.classList.contains('title'))
			{
				if (!isFunction(currView.callback.hdr))
					return;

				schedule(currView.callback.hdr.bind(null, currView.viewDate))();
			}
			else if (e.target.classList.contains('nav') || e.target.parentNode.classList.contains('nav'))
			{
				if (!isFunction(currView.callback.nav) || !currView.nav)
					return;

				var el = e.target.classList.contains('nav') ? e.target : e.target.parentNode;
				schedule(currView.callback.nav.bind(null, el.classList.contains('prev') ? currView.nav.prev : currView.nav.next))();
			}
			else
			{
				// check main cells
				if (!isFunction(currView.callback.cell))
					return;

				currView.set.some(function(setObj)
				{
					var cond = (setObj.cell == e.target);

					if (cond)
						schedule(currView.callback.cell.bind(null, setObj.date))();

					return cond;
				});
			}
		}


		function createLayout()
		{
			if (!wrapperObj)
				return;

			currView = { callback : { cell : null, nav : null, hdr : null } };

			wrapperObj.onclick = onTableClick;
			initWheel(wrapperObj, onWheel);

			cellsContainer = ce('div', { className : 'calTbl' });
			addChilds(wrapperObj, [ renderHead(), cellsContainer ]);
		}


		// Remove highlight from all cells
		function cleanHL()
		{
			if (!currView || !isArray(currView.set))
				return;

			currView.set.forEach(function(dateObj)
			{
				dateObj.cell.classList.remove('hl');
			});
		}


		// Remove all markers from all cells
		function cleanAll()
		{
			if (!currView || !isArray(currView.set))
				return;

			currView.set.forEach(function(dateObj)
			{
				dateObj.cell.classList.remove('hl', 'act');
			});
		}


		// Highlight specified range of cells
		function highLightRange(range)
		{
			if (!range || !range.start || !range.end || !currView || !isArray(currView.set))
				return;

			currView.set.forEach(function(dateObj)
			{
				if (inRange(dateObj.date, range))
				{
					dateObj.cell.classList.add('hl');
				}
			});
		}


		// Activate cell by specified date
		function activateCell(date)
		{
			var cell = findCell(date);
			if (cell)
				cell.classList.add('act');
		}


		// Activate cell by specified date
		function deactivateCell(date)
		{
			var cell = findCell(date);
			if (cell)
				cell.classList.remove('act');
		}


		// Find cell element by date
		function findCell(date)
		{
			var cell = null;

			if (!isDate(date) || !currView || !isArray(currView.set))
				return null;

			currView.set.some(function(dateObj)
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
			if (actDate != null)
				deactivateCell(actDate);

			actDate = date;
			activateCell(actDate);

			if (isFunction(dateCallback))
				dateCallback(date);

			if (rangeMode)
				onRangeSelect(date);
		}


		// Range select inner callback
		function onRangeSelect(date)
		{
			cleanHL();

			curRange = { start : null, end : null };
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

			if (isFunction(rangeCallback) && selRange.start && selRange.end)
			{
				curRange = { start : selRange.start, end : selRange.end };
				selRange = { start : null, end : null };

				cleanAll();
				highLightRange(curRange);

				rangeCallback(curRange);
			}
		}


		// Handle animation end event
		function onTransitionEnd(e)
		{
			if (e.target != currView.cellsTable || e.propertyName != 'transform')
				return;

			cellsContainer.classList.remove('animated');
			nextView.cellsTable.classList.remove('layered', 'bottom_to', 'top_to');
			nextView.cellsTable.style.left = '';
			transform(nextView.cellsTable, '');
			cellsContainer.style.width = '';
			cellsContainer.style.height = '';
			re(currView.cellsTable);
			applyView(nextView, nextCallbacks);

			animation = false;
			cellsContainer.removeEventListener('transitionend', onTransitionEnd);
		}


		// Set new view
		function applyView(newView, callbacks)
		{
			currView = newView;
			setTitle(currView.title);
			currView.callback = callbacks;
		}


		// Set new view or replace current view with specified
		function setView(newView, callbacks)
		{
			if (!cellsContainer || !newView || !callbacks)
				return;

			if (!currView.cellsTable || !isAnimated)
			{
				cellsContainer.appendChild(newView.cellsTable);
				if (currView.cellsTable && !isAnimated)
					re(currView.cellsTable);
				applyView(newView, callbacks);
				return;
			}

			animation = true;

			var currTblWidth = cellsContainer.offsetWidth;
			var currTblHeight = cellsContainer.offsetHeight;

			cellsContainer.appendChild(newView.cellsTable);

			cellsContainer.style.width = px(currTblWidth);
			cellsContainer.style.height = px(currTblHeight);

			if (currView.type == newView.type)
			{
				var leftToRight = currView.viewDate < newView.viewDate;

				currView.cellsTable.classList.add('layered');
				newView.cellsTable.classList.add('layered');

				newView.cellsTable.style.left = px(leftToRight? currTblWidth : -currTblWidth);

				cellsContainer.classList.add('animated');

				cellsContainer.style.height = px(newView.cellsTable.offsetHeight);
				var trMatrix = [1, 0, 0, 1, (leftToRight? -currTblWidth : currTblWidth), 0];
				transform(currView.cellsTable, 'matrix(' + trMatrix.join() + ')');
				transform(newView.cellsTable, 'matrix(' + trMatrix.join() + ')');

				nextView = newView;
				nextCallbacks = callbacks;

				cellsContainer.addEventListener('transitionend', onTransitionEnd);
			}
			else
			{
				var goUp = (currView.type < newView.type);
				var cellElement = null;
				var cellView = (goUp) ? newView : currView;
				var relView = (goUp) ? currView : newView;
				var relYear = relView.viewDate.getFullYear();
				var relMonth = relView.viewDate.getMonth();

				cellView.set.some(function(cellObj)
				{
					var cond = false;

					if (relView.type == MONTH_VIEW)			// navigate from month view to year view
						cond = (cellObj.date.getFullYear() == relYear &&
								cellObj.date.getMonth() == relMonth);
					else if (relView.type == YEAR_VIEW)		// navigate from year view to years range
						cond = (cellObj.date.getFullYear() == relYear);

					if (cond)
						cellElement = cellObj.cell;

					return cond;
				});

				if (!cellElement)
					return;

				var cellX = cellElement.offsetLeft;
				var cellY = cellElement.offsetTop;

				newView.cellsTable.classList.add('layered', ((goUp) ? 'bottom_to' : 'top_to'));

				var scaleX = cellElement.offsetWidth / currTblWidth;
				var scaleY = cellElement.offsetHeight / currTblHeight;

				var cellTrans = [scaleX, 0, 0, scaleY, cellX, cellY].map(toFix);
				var viewTrans = [1 / scaleX, 0, 0, 1 / scaleY, -cellX / scaleX, -cellY / scaleY].map(toFix);

				transform(newView.cellsTable, 'matrix(' + (goUp ? viewTrans : cellTrans).join() + ')');

				currView.cellsTable.classList.add('layered', ((goUp) ? 'top_from' : 'bottom_from'));

				setTimeout(function()
				{
					cellsContainer.classList.add('animated');
					cellsContainer.style.height = px(newView.cellsTable.offsetHeight);
					newView.cellsTable.style.opacity = 1;
					currView.cellsTable.style.opacity = 0;
					transform(newView.cellsTable, '');
					transform(currView.cellsTable, 'matrix(' + (goUp ? cellTrans : viewTrans).join() + ')');

					nextView = newView;
					nextCallbacks = callbacks;

					cellsContainer.addEventListener('transitionend', onTransitionEnd);
				}, 100);
			}
		}


		// Month change callback
		function showMonth(date)
		{
			var viewObj = createMonthView(date);
			setView(viewObj, { cell : onDayClick, nav : showMonth, hdr : showYear});

			activateCell(actDate);

			if (rangeMode)
				highLightRange(curRange);
		}


		// Show year view to select month
		function showYear(date)
		{
			var viewObj = createYearView(date);
			setView(viewObj, { cell : showMonth, nav : showYear, hdr : showYearRange});
		}


		// Show year range view to select year
		function showYearRange(date)
		{
			var viewObj = createYearRangeView(date);
			setView(viewObj, { cell : showYear, nav : showYearRange, hdr : null});
		}


		// Show/hide date picker contol
		function showView(val)
		{
			if (val === undefined)
				val = true;

			show(wrapperObj, val);

			// check position of control in window and place it to be visible
			if (val && !isStatic)
			{
				if (getOffset(wrapperObj).top + wrapperObj.offsetHeight > document.documentElement.clientHeight)
				{
					wrapperObj.style.bottom = px((relativeParent) ? relativeParent.offsetHeight : 0);
				}
				else
				{
					wrapperObj.style.bottom = '';
				}
			}

			// set automatic hide on empty click
			if (!isStatic)
			{
				if (val)
					setEmptyClick(showView.bind(self, false), [wrapperObj, relativeParent]);
				else
					setEmptyClick();
			}

			if (val && isFunction(showCallback))
				showCallback();
			if (!val && isFunction(hideCallback))
				hideCallback();
		}


		// Date picker instance
		function create(params)
		{
			if (!params.wrapper_id)
				return;

			baseObj = ge(params.wrapper_id);
			if (!baseObj)
				return;
			removeChilds(baseObj);
			baseObj.classList.add('calBase');

			wrapperObj = ce('div', { className : 'calWrap' });
			isStatic = params.static === true;
			if (isStatic)
				wrapperObj.classList.add('staticCal');
			else
				show(wrapperObj, false);
			baseObj.appendChild(wrapperObj);

			if (params.range == true && isFunction(params.onrangeselect))
			{
				rangeMode = true;
				rangeCallback = params.onrangeselect;
			}
			dateCallback = params.ondateselect;

			showCallback = params.onshow || null;
			hideCallback = params.onhide || null;
			isAnimated = (document.addEventListener && params.animated) || false;

			if (params.relparent)
			{
				relativeParent = ge(params.relparent);
			}

			// Prepare date
			var date = isDate(params.date) ? params.date : new Date();

			createLayout();

			showMonth(date);
		}

		create(params);


		// public methods of date picker instance

		// Show/hide date picker
		this.show = function(val)
		{
			showView(val);
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


	// Calendar global object public methods
	this.create = function(params)
	{
		return new datePicker(params);
	}


	this.format = function(date, month, year)
	{
		return formatDate(date, month, year);
	}
})();
