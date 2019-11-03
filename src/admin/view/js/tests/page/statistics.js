if (typeof module !== 'undefined' && module.exports)
{
	const _ = require('../../../../../view/js/common.js');
	var extend = _.extend;

	var TestPage = require('./page.js');
}


// Statistics page class
function StatisticsPage()
{
	StatisticsPage.parent.constructor.apply(this, arguments);
}


extend(StatisticsPage, TestPage);


StatisticsPage.prototype.parseContent = async function()
{
	var res = { titleEl : await this.query('.content_wrap > .heading > h1') };

	if (!res.titleEl)
		throw new Error('Wrong statistics page structure');

	res.typeMenu = await this.parseTransactionTypeMenu(await this.query('#trtype_menu'));
	res.title = await this.prop(res.titleEl, 'innerText');

	let filtersList = await this.queryAll('.tr_filter.filter_sel');
	if (!filtersList || filtersList.length != 4)
		throw new Error('Wrong statistics page structure');

	res.filterByDropDown = await this.parseDropDown(await this.query(filtersList[0], ':scope > *'));
	res.accountsDropDown = (await this.isVisible(filtersList[1])) ? await this.parseDropDown(await this.query(filtersList[1], ':scope > *')) : null;
	res.currencyDropDown = (await this.isVisible(filtersList[2])) ? await this.parseDropDown(await this.query(filtersList[2], ':scope > *')) : null;
	res.groupDropDown = await this.parseDropDown(await this.query(filtersList[3], ':scope > *'));

	res.chart = { elem : await this.query('#chart'), bars : [] };
	if (!res.chart)
		throw new Error('Wrong statistics page structure');

	let bars = await this.queryAll(res.chart.elem, 'svg > rect');
	for(const bar of bars)
	{
		let nodeOpacity = await this.prop(bar, 'attributes.fill-opacity.nodeValue');
		if (nodeOpacity == '1')
			res.chart.bars.push({ elem : bar, height : await this.prop(bar, 'attributes.height.nodeValue') });
	}

	return res;
};


StatisticsPage.prototype.filterByType = async function(type)
{
	if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
		return;

	return this.navigation(() => this.content.typeMenu.items[type].click());
};


StatisticsPage.prototype.byAccounts = function()
{
	return this.navigation(() => this.content.filterByDropDown.selectByValue(0));
};


StatisticsPage.prototype.byCurrencies = function()
{
	return this.navigation(() => this.content.filterByDropDown.selectByValue(1));
};


StatisticsPage.prototype.selectAccount = async function(acc_id)
{
	if (!this.content.accountsDropDown)
		throw new Error('Account drop down control not found');

	return this.navigation(() => this.content.accountsDropDown.selectByValue(acc_id));
};


StatisticsPage.prototype.selectAccountByPos = async function(pos)
{
	if (!this.content.accountsDropDown)
		throw new Error('Account drop down control not found');

	return this.selectAccount(this.content.accountsDropDown.items[pos].id);
};


StatisticsPage.prototype.selectCurrency = function(curr_id)
{
	return this.navigation(() => this.content.currencyDropDown && this.content.currencyDropDown.selectByValue(1));
};


StatisticsPage.prototype.selectCurrencyByPos = function(pos)
{
	if (this.content.currencyDropDown)
		return this.selectCurrency(this.content.currencyDropDown.items[pos].id);
};


StatisticsPage.prototype.groupBy = function(group)
{
	return this.navigation(() => this.content.groupDropDown.selectByValue(group));
};


StatisticsPage.prototype.noGroup = function(group)
{
	return this.groupBy(0);
};


StatisticsPage.prototype.groupByDay = function(group)
{
	return this.groupBy(1);
};


StatisticsPage.prototype.groupByWeek = function(group)
{
	return this.groupBy(2);
};


StatisticsPage.prototype.groupByMonth = function(group)
{
	return this.groupBy(3);
};


StatisticsPage.prototype.groupByYear = function(group)
{
	return this.groupBy(4);
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = StatisticsPage;
