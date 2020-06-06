import { NullableComponent } from './component.js';
import { copyObject, isDate } from '../../common.js';

const shortMonthTitles = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthTitles = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const actionDelay = 600;


export class DatePicker extends NullableComponent
{
	async parse()
	{
		this.wrapper = await this.query(this.elem, '.calWrap');

		this.prevBtn = await this.query(this.wrapper, '.calHeadTbl .nav.prev');
		this.nextBtn = await this.query(this.wrapper, '.calHeadTbl .nav.next');
		this.titleElem = await this.query(this.wrapper, '.title');
		this.title = await this.prop(this.titleElem, 'innerText');

		this.cells = [];
		this.viewType = 'month';
		let elems = await this.queryAll(this.wrapper, '.calTbl td');
		for(let elem of elems)
		{
			if (await this.hasClass(elem, 'monthCell'))
				this.viewType = 'year';
			else if (await this.hasClass(elem, 'yearCell'))
				this.viewType = 'yearRange';

			if (await this.hasClass(elem, 'omonth'))
				continue;

			let cell = {
				elem : elem,
				title : await this.prop(elem, 'innerText'),
				active : await this.hasClass(elem, 'act'),
				highlighted : await this.hasClass(elem, 'hl')
			};

			this.cells.push(cell);
		}

		this.current = this.parseHeader(this.title);
	}


	parseHeader(title)
	{
		let res = {};

		if (this.viewType == 'month')
		{
			const titleItems = title.split(' ');
			
			res.month = monthTitles.indexOf(titleItems[0].toLowerCase());
			if (res.month === -1)
				throw new Error('Invalid month string');
			res.year = parseInt(titleItems[1]);
		}
		else if (this.viewType == 'year')
		{
			res.year = parseInt(title);
		}
		else if (this.viewType == 'yearRange')
		{
			const titleItems = title.split('-');
			res.yearRange = {
				start : parseInt(titleItems[0]),
				end : parseInt(titleItems[1])
			};
		}

		return res;
	}


	async selectCell(val)
	{
		if (!await this.isVisible(this.wrapper))
			throw new Error('DatePicker is not visible');

		const lval = val.toString().toLowerCase();
		let cell = this.cells.find(item => item.title.toLowerCase() == lval);
		if (!cell)
			throw new Error('Specified cell not found');

		await this.click(cell.elem);
	}


	async isTitleChanged()
	{
		let titleElem = await this.query(this.elem, '.calWrap .title');
		if (!titleElem)
			return false;

		let title = await this.prop(titleElem, 'innerText');

		return title != this.title;
	}


	async navigateToPrevious()
	{
		await this.click(this.prevBtn);
		await this.wait(() => this.isTitleChanged());
		await this.parse();
	}


	async navigateToNext()
	{
		await this.click(this.nextBtn);
		await this.wait(() => this.isTitleChanged());
		await this.parse();
	}


	async zoomOut()
	{
		await this.click(this.titleElem);
		await this.wait(() => this.isTitleChanged());
		await this.parse();
	}


	async selectYear(year)
	{
		if (this.viewType != 'yearRange')
			throw new Error(`Invalid type of date picker view: ${this.viewType}`);

		while(this.current.yearRange.start > year)
			this.navigateToPrevious();

		while(this.current.yearRange.end < year)
			this.navigateToNext();

		await this.selectCell(year);
		await this.wait(() => this.isTitleChanged());
		await this.parse();
	}


	async selectMonth(month, year)
	{
		if (this.viewType != 'year')
			throw new Error(`Invalid type of date picker view: ${this.viewType}`);

		if (this.current.year != year)
		{
			if (this.current.year > year && this.current.year - year <= 2)
			{
				while(this.current.year > year)
					await this.navigateToPrevious();
			}
			else if (this.current.year < year && year - this.current.year <= 2)
			{
				while(this.current.year < year)
					await this.navigateToNext();
			}
			else
			{
				await this.zoomOut();
				await this.selectYear(year);
				await this.parse();
			}
		}

		await this.selectCell(shortMonthTitles[month]);
		await this.wait(() => this.isTitleChanged());
		await this.parse();
	}


	async selectDate(date)
	{
		if (!isDate(date))
			throw new Error('Invalid parameters');

		if (this.viewType != 'month')
			throw new Error(`Invalid type of date picker view: ${this.viewType}`);

		let day = date.getDate();
		let month = date.getMonth();
		let year = date.getFullYear();

		if (this.current.year != year)
		{
			await this.zoomOut();
			await this.selectMonth(month, year);
		}
		if (this.current.year != year)
			throw new Error('Fail to set up specified year');

		if (this.current.month != month)
		{
			if (this.current.month > month && this.current.month - month <= 2)
			{
				while(this.current.month > month)
					await this.navigateToPrevious();
			}
			else if (this.current.month < month && month - this.current.month <= 2)
			{
				while(this.current.month < month)
					await this.navigateToNext();
			}
			else
			{
				await this.zoomOut();
				await this.selectMonth(month, year);
			}
		}
		if (this.current.month != month)
			throw new Error('Fail to set up specified month');
		
		return this.selectCell(day);
	}


	async selectRange(date1, date2)
	{
		if (!isDate(date1) || !isDate(date2))
			throw new Error('Invalid parameters');

		await this.selectDate(date1);
		return this.selectDate(date2);
	}


	getSelectedRange()
	{
		return copyObject(this.value);
	}
}
