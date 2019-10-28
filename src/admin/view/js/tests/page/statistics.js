// Statistics page class
function StatisticsPage()
{
	StatisticsPage.parent.constructor.apply(this, arguments);
}


extend(StatisticsPage, TestPage);


StatisticsPage.prototype.parseContent = async function()
{
	var res = { titleEl : await vquery('.content_wrap > .heading > h1') };

	if (!res.titleEl)
		throw new Error('Wrong statistics page structure');

	res.typeMenu = await this.parseTransactionTypeMenu(await vquery('#trtype_menu'));
	res.title = res.titleEl.innerText;

	let filtersList = await vqueryall('.tr_filter.filter_sel');
	if (!filtersList || filtersList.length != 4)
		throw new Error('Wrong statistics page structure');

	res.filterByDropDown = await this.parseDropDown(filtersList[0].firstElementChild);
	res.accountsDropDown = isVisible(filtersList[1]) ? await this.parseDropDown(filtersList[1].firstElementChild) : null;
	res.currencyDropDown = isVisible(filtersList[2]) ? await this.parseDropDown(filtersList[2].firstElementChild) : null;
	res.groupDropDown = await this.parseDropDown(filtersList[3].firstElementChild);

	res.chart = { elem : await vquery('#chart'), bars : [] };
	if (!res.chart)
		throw new Error('Wrong statistics page structure');

	let bars = await vqueryall(res.chart.elem, 'svg > rect');
	bars.forEach(bar =>
	{
		if (bar.attributes['fill-opacity'].nodeValue == '1')
			res.chart.bars.push({ elem : bar, height : bar.attributes['height'].nodeValue });
	});

	return res;
};


StatisticsPage.prototype.filterByType = function(type)
{
	if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
		return;

	return navigation(() => this.content.typeMenu.items[type].click(), StatisticsPage);
};


StatisticsPage.prototype.byAccounts = function()
{
	return navigation(() => this.content.filterByDropDown.selectByValue(0), StatisticsPage);
};


StatisticsPage.prototype.byCurrencies = function()
{
	return navigation(() => this.content.filterByDropDown.selectByValue(1), StatisticsPage);
};


StatisticsPage.prototype.selectAccount = function(acc_id)
{
	return navigation(() => this.content.accountsDropDown && this.content.accountsDropDown.selectByValue(acc_id), StatisticsPage);
};


StatisticsPage.prototype.selectAccountByPos = function(pos)
{
	if (this.content.accountsDropDown)
		return this.selectAccount(this.content.accountsDropDown.items[pos].id);
};


StatisticsPage.prototype.selectCurrency = function(curr_id)
{
	return navigation(() => this.content.currencyDropDown && this.content.currencyDropDown.selectByValue(1), StatisticsPage);
};


StatisticsPage.prototype.selectCurrencyByPos = function(pos)
{
	if (this.content.currencyDropDown)
		return this.selectCurrency(this.content.currencyDropDown.items[pos].id);
};


StatisticsPage.prototype.groupBy = function(group)
{
	return navigation(() => this.content.groupDropDown.selectByValue(group), StatisticsPage);
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
