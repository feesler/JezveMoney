// Main page tests
function MainPage()
{
	MainPage.parent.constructor.apply(this, arguments);
}


extend(MainPage, TestPage);


MainPage.prototype.parseContent = async function()
{
	var widgetsElem = await this.queryAll('.content_wrap .widget');
	if (!widgetsElem)
		throw new Error('Fail to parse main page widgets');

	var res = {};
	res.widgets = [];
	for(var i = 0; i < widgetsElem.length; i++)
	{
		var widget = { elem : widgetsElem[i],
						titleElem : await this.query(widgetsElem[i], '.widget_title'),
						linkElem : await this.query(widgetsElem[i], '.widget_title > a'),
						textElem : await this.query(widgetsElem[i], '.widget_title span') };

		if (widget.linkElem)
			widget.link = widget.linkElem.href;
		if (widget.textElem)
			widget.title = widget.textElem.innerText;

		var tiles = await this.parseTiles(await this.query(widget.elem, '.tiles'));
		if (tiles)
			widget.tiles = tiles;
		tiles = await this.parseInfoTiles(await this.query(widget.elem, '.info_tiles'));
		if (tiles)
			widget.infoTiles = tiles;

		var transactions = await this.parseTransactionsList(await this.query(widget.elem, '.trans_list'));
		if (transactions)
			widget.transList = transactions;

		res.widgets.push(widget);
	}

	return res;
};


MainPage.prototype.goToAccounts = function()
{
 	if (!this.content.widgets || !this.content.widgets[0])
		throw new Error('Accounts widget not found');

	var widget = this.content.widgets[0];
	if (widget.title != 'Accounts')
		throw new Error('Wrong widget');

	return this.navigation(() => this.click(widget.linkElem), AccountsPage);
};


MainPage.prototype.goToNewTransactionByAccount = function(accNum)
{
	if (!this.content.widgets || !this.content.widgets[0])
		throw new Error('Wrong state of main page');

	var accWidget = this.content.widgets[0];
	if (accWidget.title != 'Accounts')
		throw new Error('Wrong state of accounts widget');

	 if (!accWidget.tiles || accWidget.tiles.length <= accNum)
		throw new Error('Tile ' + accNum + ' not found');

	var tile = accWidget.tiles[accNum];
	var link = tile.linkElem;

	return this.navigation(() => this.click(link), ExpenseTransactionPage);
};


MainPage.prototype.goToTransactions = function()
{
	if (!this.content || !this.content.widgets || this.content.widgets.length != 5)
		throw new Error('Fail to parse main page widgets');

	var widget = this.content.widgets[2];
	if (widget.title != 'Transactions')
		throw new Error('Wrong widget');

	return this.navigation(() => this.click(widget.linkElem), TransactionsPage);
};


MainPage.prototype.goToPersons = function()
{
	if (!this.content || !this.content.widgets || this.content.widgets.length != 5)
		throw new Error('Fail to parse main page widgets');

	var widget = this.content.widgets[3];
	if (widget.title != 'Persons')
		throw new Error('Wrong widget');

	return this.navigation(() => this.click(widget.linkElem), PersonsPage);
};


MainPage.prototype.goToStatistics = function()
{
	if (!this.content || !this.content.widgets || this.content.widgets.length != 5)
		throw new Error('Fail to parse main page widgets');

	var widget = this.content.widgets[4];
	if (widget.title != 'Statistics')
		throw new Error('Wrong widget');

	return this.navigation(() => this.click(widget.linkElem), StatisticsPage);
};
