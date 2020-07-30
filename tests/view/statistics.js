import { TestView } from './testview.js';
import { DropDown } from './component/dropdown.js';
import { TransactionTypeMenu } from './component/transactiontypemenu.js';


// Statistics view class
export class StatisticsView extends TestView
{
	async parseContent()
	{
		let res = {
			titleEl : await this.query('.content_wrap > .heading > h1')
		};

		if (!res.titleEl)
			throw new Error('Wrong statistics view structure');

		res.typeMenu = await TransactionTypeMenu.create(this, await this.query('#trtype_menu'));
		res.title = await this.prop(res.titleEl, 'innerText');

		let filtersList = await this.queryAll('.tr_filter.filter_sel');
		if (!filtersList || filtersList.length != 4)
			throw new Error('Wrong statistics view structure');

		res.filterByDropDown = await DropDown.createFromChild(this, await this.query('#filter_type'));

		res.accountsDropDown = null;
		if (await this.isVisible(filtersList[1]))
		{
			res.accountsDropDown = await DropDown.createFromChild(this, await this.query('#acc_id'));
		}

		res.currencyDropDown = null;
		if (await this.isVisible(filtersList[2]))
		{
			res.currencyDropDown = await DropDown.createFromChild(this, await this.query('#curr_id'));
		}

		res.groupDropDown = await DropDown.createFromChild(this, await this.query('#groupsel'));

		res.chart = { elem : await this.query('#chart'), bars : [] };
		if (!res.chart)
			throw new Error('Wrong statistics view structure');

		let bars = await this.queryAll(res.chart.elem, 'svg > rect');
		for(const bar of bars)
		{
			let nodeOpacity = await this.prop(bar, 'attributes.fill-opacity.nodeValue');
			if (nodeOpacity == '1')
				res.chart.bars.push({ elem : bar, height : await this.prop(bar, 'attributes.height.nodeValue') });
		}

		return res;
	}


	async filterByType(type)
	{
		if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
			return;

		return this.navigation(() => this.content.typeMenu.items[type].click());
	}


	async byAccounts()
	{
		return this.navigation(() => this.content.filterByDropDown.selectByValue(0));
	}


	async byCurrencies()
	{
		return this.navigation(() => this.content.filterByDropDown.selectByValue(1));
	}


	async selectAccount(acc_id)
	{
		if (!this.content.accountsDropDown)
			throw new Error('Account drop down control not found');

		return this.navigation(() => this.content.accountsDropDown.selectByValue(acc_id));
	}


	async selectAccountByPos(pos)
	{
		if (!this.content.accountsDropDown)
			throw new Error('Account drop down control not found');

		return this.selectAccount(this.content.accountsDropDown.items[pos].id);
	}


	async selectCurrency(curr_id)
	{
		return this.navigation(() => this.content.currencyDropDown && this.content.currencyDropDown.selectByValue(1));
	}


	async selectCurrencyByPos(pos)
	{
		if (this.content.currencyDropDown)
			return this.selectCurrency(this.content.currencyDropDown.items[pos].id);
	}


	async groupBy(group)
	{
		return this.navigation(() => this.content.groupDropDown.selectByValue(group));
	}


	async noGroup()
	{
		return this.groupBy(0);
	}


	async groupByDay()
	{
		return this.groupBy(1);
	}


	async groupByWeek()
	{
		return this.groupBy(2);
	}


	async groupByMonth()
	{
		return this.groupBy(3);
	}


	async groupByYear()
	{
		return this.groupBy(4);
	}
}
