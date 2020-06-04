import { NullableComponent } from './component.js';
import { copyObject, isDate } from '../../common.js';

const shortMonthTitles = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthTitles = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const actionDelay = 600;


export class DatePicker extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.wrapper = await env.query(this.elem, '.calWrap');

		this.prevBtn = await env.query(this.wrapper, '.calHeadTbl .nav.prev');
		this.nextBtn = await env.query(this.wrapper, '.calHeadTbl .nav.next');
		this.titleElem = await env.query(this.wrapper, '.title');
		this.title = await env.prop(this.titleElem, 'innerText');

		this.cells = [];
		this.viewType = 'month';
		let elems = await env.queryAll(this.wrapper, '.calTbl td');
		for(let elem of elems)
		{
			if (await env.hasClass(elem, 'monthCell'))
				this.viewType = 'year';
			else if (await env.hasClass(elem, 'yearCell'))
				this.viewType = 'yearRange';

			if (await env.hasClass(elem, 'omonth'))
				continue;

			let cell = {
				elem : elem,
				title : await env.prop(elem, 'innerText'),
				active : await env.hasClass(elem, 'act'),
				highlighted : await env.hasClass(elem, 'hl')
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
		const env = this.parent.props.environment;

		if (!await env.isVisible(this.wrapper))
			throw new Error('DatePicker is not visible');

		const lval = val.toString().toLowerCase();
		let cell = this.cells.find(item => item.title.toLowerCase() == lval);
		if (!cell)
			throw new Error('Specified cell not found');

		await env.click(cell.elem);
		await env.timeout(actionDelay);
	}


	async navigateToPrevious()
	{
		const env = this.parent.props.environment;

		await env.click(this.prevBtn);
		await env.timeout(actionDelay);
		await this.parse();
	}


	async navigateToNext()
	{
		const env = this.parent.props.environment;

		await env.click(this.nextBtn);
		await env.timeout(actionDelay);
		await this.parse();
	}


	async zoomOut()
	{
		const env = this.parent.props.environment;

		await env.click(this.titleElem);
		await env.timeout(actionDelay);
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

		return this.selectCell(year);
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

		return this.selectCell(shortMonthTitles[month]);
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
			await this.parse();
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
				await this.parse();
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
