import { TestView } from './testview.js';


// Main view class
class MainView extends TestView
{
	async parseContent()
	{
		var widgetsElem = await this.queryAll('.content_wrap .widget');
		if (!widgetsElem)
			throw new Error('Fail to parse main view widgets');

		var res = {};
		res.widgets = [];
		for(var i = 0; i < widgetsElem.length; i++)
		{
			var widget = { elem : widgetsElem[i],
							titleElem : await this.query(widgetsElem[i], '.widget_title'),
							linkElem : await this.query(widgetsElem[i], '.widget_title > a'),
							textElem : await this.query(widgetsElem[i], '.widget_title span') };

			if (widget.linkElem)
				widget.link = await this.prop(widget.linkElem, 'href');
			if (widget.textElem)
				widget.title = await this.prop(widget.textElem, 'innerText');

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
	}


	goToAccounts()
	{
	 	if (!this.content.widgets || !this.content.widgets[this.app.config.AccountsWidgetPos])
			throw new Error('Accounts widget not found');

		var widget = this.content.widgets[this.app.config.AccountsWidgetPos];
		if (widget.title != 'Accounts')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}


	goToNewTransactionByAccount(accNum)
	{
		if (!this.content.widgets || !this.content.widgets[this.app.config.AccountsWidgetPos])
			throw new Error('Wrong state of main view');

		var accWidget = this.content.widgets[this.app.config.AccountsWidgetPos];
		if (accWidget.title != 'Accounts')
			throw new Error('Wrong state of accounts widget');

		 if (!accWidget.tiles || accWidget.tiles.items.length <= accNum)
			throw new Error('Tile ' + accNum + ' not found');

		var tile = accWidget.tiles.items[accNum];
		var link = tile.linkElem;

		return this.navigation(() => this.click(link));
	}


	goToTransactions()
	{
		if (!this.content || !this.content.widgets || this.content.widgets.length != this.app.config.widgetsCount)
			throw new Error('Fail to parse main view widgets');

		var widget = this.content.widgets[this.app.config.LatestWidgetPos];
		if (widget.title != 'Transactions')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}


	goToPersons()
	{
		if (!this.content || !this.content.widgets || this.content.widgets.length != this.app.config.widgetsCount)
			throw new Error('Fail to parse main view widgets');

		var widget = this.content.widgets[this.app.config.PersonsWidgetPos];
		if (widget.title != 'Persons')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}


	goToStatistics()
	{
		if (!this.content || !this.content.widgets || this.content.widgets.length != this.app.config.widgetsCount)
			throw new Error('Fail to parse main view widgets');

		var widget = this.content.widgets[this.app.config.StatisticsWidgetPos];
		if (widget.title != 'Statistics')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}
}


export { MainView };