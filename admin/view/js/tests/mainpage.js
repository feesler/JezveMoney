// Main page tests
function MainPage()
{
	MainPage.parent.constructor.apply(this, arguments);
}


extend(MainPage, TestPage);


MainPage.prototype.parseContent = function()
{
	var widgetsElem = vqueryall('.content_wrap .widget');
	if (!widgetsElem)
		throw new Error('Fail to parse main page widgets');

	var res = {};
	res.widgets = [];
	for(var i = 0; i < widgetsElem.length; i++)
	{
		var widget = { elem : widgetsElem[i],
						titleElem : widgetsElem[i].querySelector('.widget_title'),
						linkElem : widgetsElem[i].querySelector('.widget_title > a'),
						textElem : widgetsElem[i].querySelector('.widget_title span') };

		if (widget.linkElem)
			widget.link = widget.linkElem.href;
		if (widget.textElem)
			widget.title = widget.textElem.innerHTML;

		var tiles = this.parseTiles(widget.elem.querySelector('.tiles'));
		if (tiles)
			widget.tiles = tiles;
		tiles = this.parseInfoTiles(widget.elem.querySelector('.info_tiles'));
		if (tiles)
			widget.infoTiles = tiles;

		var transactions = this.parseTransactionsList(widget.elem.querySelector('.trans_list'));
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

	return navigation(() => clickEmul(widget.linkElem), AccountsPage);
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

	return navigation(() => clickEmul(link), ExpenseTransactionPage);
};


MainPage.prototype.goToTransactions = function()
{
	if (!this.content || !this.content.widgets || this.content.widgets.length != 5)
		throw new Error('Fail to parse main page widgets');

	var widget = this.content.widgets[2];
	if (widget.title != 'Transactions')
		throw new Error('Wrong widget');

	return navigation(() => clickEmul(widget.linkElem), TransactionsPage);
};


MainPage.prototype.goToPersons = function()
{
	if (!this.content || !this.content.widgets || this.content.widgets.length != 5)
		throw new Error('Fail to parse main page widgets');

	var widget = this.content.widgets[3];
	if (widget.title != 'Persons')
		throw new Error('Wrong widget');

	return navigation(() => clickEmul(personsWidget.linkElem), PersonsPage);
};
