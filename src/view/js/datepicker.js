/**
 * Date picker constructor
 * @param {object} params:
 * @param {string|Element} params.wrapper - identifier or Element where date picker will be rendered
 * @param {boolean} params.static - if true, date picker will be statically placed
 * @param {boolean} range - if true turn on date range select mode
 * @param {function} onrangeselect - date range select callback
 * @param {function} ondateselect - single date select callback
 * @param {function} onshow - dynamic date picker shown callback
 * @param {function} onhide - dynamic date picker hidden callback
 * @param {boolean} animated - animate transitions between views if possible
 * @param {string} relparent - identifier of relative alignment element
 * @param {Date} date - initial date to show
 */
function DatePicker(params)
{
    this.baseObj = null;
    this.wrapperObj = null;
    this.isStatic = false;
    this.relativeParent = null;
    this.dateCallback = null;
    this.rangeCallback = null;
    this.showCallback = null;
    this.hideCallback = null;
    this.currView = null;
    this.nextView = null;
    this.nextCallbacks = null;
    this.actDate = null;
    this.rangeMode = false;
    this.curRange = { start: null, end: null };
    this.selRange = { start: null, end: null };
    this.titleEl = null;
    this.cellsContainer = null;
    this.isAnimated = true;
    this.animation = false;

    if (!('wrapper' in params)) {
        throw new Error('Wrapper element not specified');
    }

    this.baseObj = (typeof params.wrapper === 'string') ? ge(params.wrapper) : params.wrapper;
    if (!this.baseObj) {
        throw new Error('Invalid wrapper element');
    }

    removeChilds(this.baseObj);
    this.baseObj.classList.add('dp__container');

    this.wrapperObj = ce('div', { className: 'dp__wrapper' });
    this.isStatic = (params.static === true);
    if (this.isStatic) {
        this.wrapperObj.classList.add('dp__static-wrapper');
    } else {
        show(this.wrapperObj, false);
    }
    this.baseObj.appendChild(this.wrapperObj);

    if (params.range == true) {
        this.rangeMode = true;
    }
    if (this.rangeMode && isFunction(params.onrangeselect)) {
        this.rangeCallback = params.onrangeselect;
    }

    this.dateCallback = params.ondateselect;

    this.showCallback = params.onshow || null;
    this.hideCallback = params.onhide || null;
    this.isAnimated = (document.addEventListener && params.animated) || false;

    if (params.relparent) {
        this.relativeParent = (typeof params.relparent === 'string') ? ge(params.relparent) : params.relparent;
    }

    this.transitionHandler = this.onTransitionEnd.bind(this);

    // Prepare date
    var date = isDate(params.date) ? params.date : new Date();

    this.createLayout();
    this.showMonth(date);
}


// Static properties
DatePicker.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
DatePicker.weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
DatePicker.MONTH_VIEW = 1;
DatePicker.YEAR_VIEW = 2;
DatePicker.YEARRANGE_VIEW = 3;


/** Static alias for DatePicker constructor */
DatePicker.create = function(params)
{
    return new DatePicker(params);
};


/**
 * Format date as DD.MM.YYYY
 * @param {number|Date} date - day or Date object to 
 * @param {number} month - month of Date to format
 * @param {number} year - year of Date to format
 */
DatePicker.format = function(date, month, year)
{
    if (isDate(date) && !month && !year) {
        month = date.getMonth();
        year = date.getFullYear();
        date = date.getDate();
    }

    return ((date > 9) ? '' : '0') + date + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year;
};


// Methods of instance

/**
 * Convert float value for CSS transform
 * @param {number} val - float value to convert
 */
function toFix(val)
{
    return +val.toFixed(4);
}


/**
 * Return count of days in specified month
 * @param {Date} date - Date object for specified month
 */
DatePicker.prototype.getDaysInMonth = function(date)
{
    var date = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    return date.getDate();
};


/**
 * Return fixed(0 - monday, 6 - sunday) day of week of specified date
 * @param {*} date - Date object for specified day
 */
DatePicker.prototype.getDayOfWeek = function(date)
{
    if (!isDate(date)) {
        return null;
    }

    var res = date.getDay();

    return (res) ? (res - 1) : 6;
};


/**
 * Create year picker view
 * @param {Date} date - Date object for specified year range
 */
DatePicker.prototype.createYearRangeView = function(date)
{
    if (!isDate(date)) {
        return null;
    }

    // get real date from specified
    var rangeLength = 10;
    var rYear = date.getFullYear();
    var startYear = rYear - (rYear % 10) - 1;

    var res = {
        type: DatePicker.YEARRANGE_VIEW,
        set: [],
        viewDate: date,
        title: (startYear + 1) + '-' + (startYear + rangeLength),
        viewContainer: ce('div', { className: 'dp__view-container' }),
        nav: {
            prev: new Date(rYear - rangeLength, 1, 1),
            next: new Date(rYear + rangeLength, 1, 1)
        }
    };

    // years of current range
    for (var i = 0; i < rangeLength + 2; i++) {
        var setObj = {
            date: new Date(startYear + i, 0, 1)
        };

        setObj.cell = ce('div', {
            className: 'dp__cell dp__year-range-view__cell',
            textContent: setObj.date.getFullYear()
        });

        if (i == 0 || i == rangeLength + 1) {
            setObj.cell.classList.add('dp__other-month-cell');
        }

        res.set.push(setObj);
        res.viewContainer.append(setObj.cell);
    }

    return res;
};


/**
 * Create month picker view
 * @param {Date} date - Date object for specified year
 */
DatePicker.prototype.createYearView = function(date)
{
    if (!isDate(date)) {
        return null;
    }

    // get real date from specified
    var rYear = date.getFullYear();

    var res = {
        type: DatePicker.YEAR_VIEW,
        set: [],
        viewDate: date,
        title: rYear,
        viewContainer: ce('div', { className: 'dp__view-container' }),
        nav: {
            prev: new Date(rYear - 1, 1, 1),
            next: new Date(rYear + 1, 1, 1)
        }
    };

    // months of current year
    for (var i = 0; i < DatePicker.months.length; i++) {
        var setObj = {
            date: new Date(rYear, i, 1)
        };
        setObj.cell = ce('div', {
            className: 'dp__cell dp__year-view__cell',
            textContent: DatePicker.months[setObj.date.getMonth()].substr(0, 3)
        });

        res.set.push(setObj);
        res.viewContainer.append(setObj.cell);
    }

    return res;
};


/**
 * Create date picker view
 * @param {Date} date - Date object for specified month
 */
DatePicker.prototype.createMonthView = function(date)
{
    if (!isDate(date))
        return null;

    var daysInWeek = 7;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    // get real date from specified
    var rMonth = date.getMonth();
    var rYear = date.getFullYear();
    var daysInMonth = this.getDaysInMonth(date);

    var res = {
        type: DatePicker.MONTH_VIEW,
        set: [],
        viewDate: date,
        title: DatePicker.months[rMonth] + ' ' + rYear,
        viewContainer: ce('div', { className: 'dp__view-container' }),
        nav: {
            prev: new Date(rYear, rMonth - 1, 1),
            next: new Date(rYear, rMonth + 1, 1)
        }
    };

    // week days
    var weekDaysHeader = DatePicker.weekdays.map(function(item)
    {
        return ce('div', {
            className: 'dp__cell dp__month-view_cell dp__weekday-cell',
            textContent: item
        });
    });
    addChilds(res.viewContainer, weekDaysHeader);

    // days of previous month
    var pMonthDays = this.getDaysInMonth(res.nav.prev);
    var dayOfWeek = this.getDayOfWeek(new Date(rYear, rMonth, 1));		// week day of first day in month
    var i, setObj, daysInRow = dayOfWeek;
    for (i = 1; i <= dayOfWeek; i++) {
        setObj = {
            date: new Date(res.nav.prev.getFullYear(), res.nav.prev.getMonth(), pMonthDays - (dayOfWeek - i))
        };

        setObj.cell = ce('div', { className: 'dp__cell dp__month-view_cell dp__other-month-cell dp__day-cell', textContent: setObj.date.getDate() });

        res.set.push(setObj);
    }

    // days of current month
    for (i = 1; i < daysInMonth + 1; i++) {
        setObj = {
            date: new Date(rYear, rMonth, i)
        };

        setObj.cell = ce('div', {
            className: 'dp__cell dp__month-view_cell dp__day-cell',
            textContent: setObj.date.getDate()
        });
        if (setObj.date - today == 0) {
            setObj.cell.classList.add('dp__today-cell');
        }

        res.set.push(setObj);
    }

    daysInRow = res.set.length % 7;
    // append days of next month
    for (i = daysInRow; i < daysInWeek; i++) {
        setObj = {
            date: new Date(res.nav.next.getFullYear(), res.nav.next.getMonth(), i - daysInRow + 1)
        };

        setObj.cell = ce('div', {
            className: 'dp__cell dp__month-view_cell dp__other-month-cell dp__day-cell',
            textContent: setObj.date.getDate()
        });

        res.set.push(setObj);
    }

    var viewIems = res.set.map(function(item)
    {
        return item.cell;
    });
    addChilds(res.viewContainer, viewIems);


    return res;
};


/**
 * Check specified date is in range
 * @param {Date} date - date to check
 * @param {object} range - date range object
 */
DatePicker.prototype.inRange = function(date, range)
{
    if (!isDate(date) || !range || !isDate(range.start) || !isDate(range.end))
        return false;

    return (date - range.start >= 0 && date - range.end <= 0);
};


/**
 * Show/hide date picker view
 * @param {boolean} val - if true then show view, hide otherwise
 */
DatePicker.prototype.showView = function(val)
{
    if (val === undefined)
        val = true;

    show(this.wrapperObj, val);

    // check position of control in window and place it to be visible
    if (val && !this.isStatic) {
        if (getOffset(this.wrapperObj).top + this.wrapperObj.offsetHeight > document.documentElement.clientHeight) {
            this.wrapperObj.style.bottom = px((this.relativeParent) ? this.relativeParent.offsetHeight : 0);
        } else {
            this.wrapperObj.style.bottom = '';
        }
    }

    // set automatic hide on empty click
    if (!this.isStatic) {
        if (val) {
            setEmptyClick(this.showView.bind(this, false), [this.wrapperObj, this.relativeParent]);
        } else {
            setEmptyClick();
        }
    }

    if (val && isFunction(this.showCallback))
        this.showCallback();
    if (!val && isFunction(this.hideCallback))
        this.hideCallback();
}


/**
 * Show/hide date picker
 * @param {boolean} val - if true then show view, hide otherwise
 */
DatePicker.prototype.show = function(val)
{
    this.showView(val);
};


/**
 * Hide date picker
 */
DatePicker.prototype.hide = function()
{
    this.show(false);
};


/**
 * Check date picker is visible
 */
DatePicker.prototype.visible = function()
{
    return isVisible(this.wrapperObj);
};


/**
 * Render header element
 */
DatePicker.prototype.renderHead = function()
{
    this.titleEl = ce('div', { className: 'dp__header_item dp__header_title' });

    var prevIcon = svg('svg', { width: '25%', viewBox: '0 0 6 13' }, svg('path', { d: 'm6 1-6 5.5 6 5.5z' }));
    this.navPrevElem = ce('div', { className: 'dp__header_item dp__header_nav' }, prevIcon);

    var nextIcon = svg('svg', { width: '25%', viewBox: '0 0 6 13' }, svg('path', { d: 'm0 1 6 5.5-6 5.5z' }));
    this.navNextElem = ce('div', { className: 'dp__header_item dp__header_nav' }, nextIcon);

    var headTbl = ce('div', { className: 'dp__header' }, [
        this.navPrevElem,
        this.titleEl,
        this.navNextElem
    ]);

    return headTbl;
};


/**
 * Set title
 * @param {string} title - title text
 */
DatePicker.prototype.setTitle = function(title)
{
    if (title && this.titleEl) {
        this.titleEl.textContent = title;
    }
};


/**
 * Mouse whell event handler
 * @param {Event} e - wheel event object
 */
DatePicker.prototype.onWheel = function(e)
{
    if (
        !this.currView ||
        !this.currView.callback ||
        this.animation ||
        e.deltaY == 0
    ) {
        return;
    }

    var dir = (e.wheelDelta > 0);
    if (!isFunction(this.currView.callback.nav) || !this.currView.nav) {
        return;
    }

    setTimeout(this.currView.callback.nav.bind(null, dir ? this.currView.nav.prev : this.currView.nav.next));

    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
};


/** View 'click' event delegate */
DatePicker.prototype.onViewClick = function(e)
{
    if (!this.currView || !this.currView.callback || this.animation)
        return;

    if (this.titleEl.contains(e.target)) {
        if (!isFunction(this.currView.callback.hdr)) {
            return;
        }

        setTimeout(this.currView.callback.hdr.bind(null, this.currView.viewDate));
    } else if (this.navPrevElem.contains(e.target)) {
        if (!isFunction(this.currView.callback.nav) || !this.currView.nav) {
            return;
        }

        setTimeout(this.currView.callback.nav.bind(null, this.currView.nav.prev));
    } else if (this.navNextElem.contains(e.target)) {
        if (!isFunction(this.currView.callback.nav) || !this.currView.nav) {
            return;
        }

        setTimeout(this.currView.callback.nav.bind(null, this.currView.nav.next));
    } else {
        // check main cells
        if (!isFunction(this.currView.callback.cell))
            return;

        this.currView.set.some(function(setObj)
        {
            var cond = (setObj.cell == e.target);

            if (cond) {
                setTimeout(this.currView.callback.cell.bind(null, setObj.date));
            }

            return cond;
        }, this);
    }
};


/**
 * Create layout of component
 */
DatePicker.prototype.createLayout = function()
{
    if (!this.wrapperObj)
        return;

    this.currView = {
        callback: {
            cell: null,
            nav: null,
            hdr: null
        }
    };

    this.wrapperObj.addEventListener('click', this.onViewClick.bind(this));
    this.wrapperObj.addEventListener('wheel', this.onWheel.bind(this));

    this.cellsContainer = ce('div', { className: 'dp__view' });
    addChilds(this.wrapperObj, [this.renderHead(), this.cellsContainer]);
};


/** Remove highlight from all cells */
DatePicker.prototype.cleanHL = function()
{
    if (!this.currView || !Array.isArray(this.currView.set))
        return;

    this.currView.set.forEach(function(dateObj)
    {
        dateObj.cell.classList.remove('dp__cell_hl');
    });
};


/** Remove all markers from all cells */
DatePicker.prototype.cleanAll = function()
{
    if (!this.currView || !Array.isArray(this.currView.set))
        return;

    this.currView.set.forEach(function(dateObj)
    {
        dateObj.cell.classList.remove('dp__cell_hl', 'dp__cell_act');
    });
};


/** Highlight specified range of cells */
DatePicker.prototype.highLightRange = function(range)
{
    if (!range || !range.start || !range.end || !this.currView || !Array.isArray(this.currView.set))
        return;

    this.currView.set.forEach(function(dateObj)
    {
        if (this.inRange(dateObj.date, range)) {
            dateObj.cell.classList.add('dp__cell_hl');
        }
    }, this);
};


/** Activate cell by specified date */
DatePicker.prototype.activateCell = function(date)
{
    var cell = this.findCell(date);
    if (cell) {
        cell.classList.add('dp__cell_act');
    }
};


/** Activate cell by specified date */
DatePicker.prototype.deactivateCell = function(date)
{
    var cell = this.findCell(date);
    if (cell) {
        cell.classList.remove('dp__cell_act');
    }
};


/**
 * Find cell element by date
 * @param {Date} date - date to look for
 */
DatePicker.prototype.findCell = function(date)
{
    if (!isDate(date) || !this.currView || !Array.isArray(this.currView.set))
        return null;

    var dateObj = this.currView.set.find(function(dateObj)
    {
        return (dateObj.date - date == 0);
    });

    return dateObj ? dateObj.cell : null;
};


/** Day cell click inner callback */
DatePicker.prototype.onDayClick = function(date)
{
    if (this.actDate != null) {
        this.deactivateCell(this.actDate);
    }

    this.actDate = date;
    this.activateCell(this.actDate);

    if (isFunction(this.dateCallback)) {
        this.dateCallback(date);
    }

    if (this.rangeMode) {
        this.onRangeSelect(date);
    }
};


/** Range select inner callback */
DatePicker.prototype.onRangeSelect = function(date)
{
    this.cleanHL();

    this.curRange = { start: null, end: null };
    if (!this.selRange.start) {
        this.selRange.start = date;
    } else {
        this.selRange.end = date;
    }

    // Check swap in needed
    if (this.selRange.start - this.selRange.end > 0) {
        var tdate = this.selRange.end;
        this.selRange.end = this.selRange.start;
        this.selRange.start = tdate;
    }

    if (this.selRange.start && this.selRange.end) {
        this.curRange = { start: this.selRange.start, end: this.selRange.end };
        this.selRange = { start: null, end: null };

        this.cleanAll();
        this.highLightRange(this.curRange);

        if (isFunction(this.rangeCallback)) {
            this.rangeCallback(this.curRange);
        }
    }
};


/**
 * Convert DD.MM.YYYY date string to Date object
 * @param {string} date 
 */
DatePicker.prototype.convDate = function(date)
{
    if (isDate(date))
        return date;
    if (typeof date !== 'string')
        return null;

    var parts = date.split('.');
    if (!Array.isArray(parts) || parts.length != 3)
        return null;

    return new Date(parts[2], parts[1] - 1, parts[0]);
};


/**
 * Set up selected items range
 * @param {Date} start - date to start selection from
 * @param {Date} end  - date to finnish selection at
 */
DatePicker.prototype.setSelection = function(date, dateTo)
{
    this.cleanHL();

    date = this.convDate(date);
    if (!date) {
        return;
    }

    dateTo = this.convDate(dateTo);
    if (dateTo) {
        /* Date range selection */
        this.curRange = { start: null, end: null };
        this.selRange = { start: date, end: dateTo };

        // Check swap in needed
        if (this.selRange.start - this.selRange.end > 0) {
            var tdate = this.selRange.end;
            this.selRange.end = this.selRange.start;
            this.selRange.start = tdate;
        }

        this.curRange = { start: this.selRange.start, end: this.selRange.end };
        this.selRange = { start: null, end: null };

        this.cleanAll();
        this.highLightRange(this.curRange);
    } else {
        /* Single day selection */
        if (this.actDate != null) {
            this.deactivateCell(this.actDate);
        }

        this.actDate = date;
        this.activateCell(this.actDate);
    }

    this.showMonth(date);
};


/**
 * 'transitionend' event handler
 * @param {*} e - Event object
 */
DatePicker.prototype.onTransitionEnd = function(e)
{
    if (
        e.target != this.currView.viewContainer ||
        e.propertyName != 'transform'
    ) {
        return;
    }

    this.cellsContainer.classList.remove('dp__animated-view');
    this.nextView.viewContainer.classList.remove('dp__layered-view', 'bottom_to', 'top_to');
    this.nextView.viewContainer.style.left = '';
    transform(this.nextView.viewContainer, '');
    this.cellsContainer.style.width = '';
    this.cellsContainer.style.height = '';
    re(this.currView.viewContainer);
    this.applyView(this.nextView, this.nextCallbacks);

    this.animation = false;
    this.cellsContainer.removeEventListener('transitionend', this.transitionHandler);
};


/**
 * Set new view
 * @param {object} newView - view object
 * @param {object} callbacks - set of view callbacks
 */
DatePicker.prototype.applyView = function(newView, callbacks)
{
    this.currView = newView;
    this.setTitle(this.currView.title);
    this.currView.callback = callbacks;
};


/**
 * Set new view or replace current view with specified
 * @param {object} newView - view object
 * @param {object} callbacks - set of view callbacks
 */
DatePicker.prototype.setView = function(newView, callbacks)
{
    if (!this.cellsContainer || !newView || !callbacks) {
        return;
    }

    if (!this.currView.viewContainer || !this.isAnimated) {
        this.cellsContainer.appendChild(newView.viewContainer);
        if (this.currView.viewContainer && !this.isAnimated) {
            re(this.currView.viewContainer);
        }
        this.applyView(newView, callbacks);
        return;
    }

    this.animation = true;

    var currTblWidth = this.cellsContainer.offsetWidth;
    var currTblHeight = this.cellsContainer.offsetHeight;

    this.cellsContainer.appendChild(newView.viewContainer);

    this.cellsContainer.style.width = px(currTblWidth);
    this.cellsContainer.style.height = px(currTblHeight);

    if (this.currView.type == newView.type) {
        var leftToRight = this.currView.viewDate < newView.viewDate;

        this.currView.viewContainer.classList.add('dp__layered-view');
        newView.viewContainer.classList.add('dp__layered-view');
        newView.viewContainer.style.width = px(currTblWidth);
        newView.viewContainer.style.left = px(leftToRight ? currTblWidth : -currTblWidth);

        this.cellsContainer.classList.add('dp__animated-view');

        this.cellsContainer.style.height = px(newView.viewContainer.offsetHeight);
        var trMatrix = [1, 0, 0, 1, (leftToRight ? -currTblWidth : currTblWidth), 0];
        transform(this.currView.viewContainer, 'matrix(' + trMatrix.join() + ')');
        transform(newView.viewContainer, 'matrix(' + trMatrix.join() + ')');

        this.nextView = newView;
        this.nextCallbacks = callbacks;

        this.cellsContainer.addEventListener('transitionend', this.transitionHandler);
    } else {
        var goUp = (this.currView.type < newView.type);
        var cellElement = null;
        var cellView = (goUp) ? newView : this.currView;
        var relView = (goUp) ? this.currView : newView;
        var relYear = relView.viewDate.getFullYear();
        var relMonth = relView.viewDate.getMonth();

        var cellElement = cellView.set.find(function(cellObj)
        {
            return (    /* navigate from month view to year view */
                relView.type == DatePicker.MONTH_VIEW &&
                cellObj.date.getFullYear() == relYear &&
                cellObj.date.getMonth() == relMonth
            ) || (      /* navigate from year view to years range */
                relView.type == DatePicker.YEAR_VIEW &&
                cellObj.date.getFullYear() == relYear
            );
        });

        if (!cellElement)
            return;
        cellElement = cellElement.cell;

        newView.viewContainer.classList.add('dp__layered-view', ((goUp) ? 'bottom_to' : 'top_to'));

        var cellX = cellElement.offsetLeft;
        var cellY = cellElement.offsetTop;
        var scaleX = cellElement.offsetWidth / currTblWidth;
        var scaleY = cellElement.offsetHeight / currTblHeight;

        var cellTrans = [scaleX, 0, 0, scaleY, cellX, cellY].map(toFix);
        var viewTrans = [1 / scaleX, 0, 0, 1 / scaleY, -cellX / scaleX, -cellY / scaleY].map(toFix);

        transform(newView.viewContainer, 'matrix(' + (goUp ? viewTrans : cellTrans).join() + ')');

        this.currView.viewContainer.classList.add('dp__layered-view', ((goUp) ? 'top_from' : 'bottom_from'));

        setTimeout(function()
        {
            this.cellsContainer.classList.add('dp__animated-view');
            this.cellsContainer.style.height = px(newView.viewContainer.offsetHeight);
            newView.viewContainer.style.opacity = 1;
            this.currView.viewContainer.style.opacity = 0;
            transform(newView.viewContainer, '');
            transform(this.currView.viewContainer, 'matrix(' + (goUp ? cellTrans : viewTrans).join() + ')');

            this.nextView = newView;
            this.nextCallbacks = callbacks;

            this.cellsContainer.addEventListener('transitionend', this.transitionHandler);
        }.bind(this), 100);
    }
};


/**
 * Show month view to select day
 * @param {Date} date - date object of month to show
 */
DatePicker.prototype.showMonth = function(date)
{
    var viewObj = this.createMonthView(date);
    this.setView(viewObj, {
        cell: this.onDayClick.bind(this),
        nav: this.showMonth.bind(this),
        hdr: this.showYear.bind(this)
    });

    this.activateCell(this.actDate);

    if (this.rangeMode)
        this.highLightRange(this.curRange);
};


/**
 * Show year view to select month
 * @param {Date} date - date object of year to show
 */
DatePicker.prototype.showYear = function(date)
{
    var viewObj = this.createYearView(date);
    this.setView(viewObj, {
        cell: this.showMonth.bind(this),
        nav: this.showYear.bind(this),
        hdr: this.showYearRange.bind(this)
    });
};


/**
 * Show year range view to select year
 * @param {Date} date - date object of year range to show
 */
DatePicker.prototype.showYearRange = function(date)
{
    var viewObj = this.createYearRangeView(date);
    this.setView(viewObj, {
        cell: this.showYear.bind(this),
        nav: this.showYearRange.bind(this),
        hdr: null
    });
};
