import { TestView } from './testview.js';
import { App } from '../app.js';
import { TransactionList } from './component/transactionlist.js';
import { TilesList } from './component/tileslist.js';
import { Tile } from './component/tile.js';
import { InfoTile } from './component/infotile.js';


// Main view class
export class MainView extends TestView
{
	async parseContent()
	{
		let widgetsElem = await this.queryAll('.content_wrap .widget');
		if (!widgetsElem)
			throw new Error('Fail to parse main view widgets');

		let res = {};
		res.widgets = [];
		for(let i = 0; i < widgetsElem.length; i++)
		{
			let widget = { elem : widgetsElem[i],
							titleElem : await this.query(widgetsElem[i], '.widget_title'),
							linkElem : await this.query(widgetsElem[i], '.widget_title > a'),
							textElem : await this.query(widgetsElem[i], '.widget_title span') };

			if (widget.linkElem)
				widget.link = await this.prop(widget.linkElem, 'href');
			if (widget.textElem)
				widget.title = await this.prop(widget.textElem, 'innerText');

			let tiles = await TilesList.create(this, await this.query('.tiles'), Tile);
			if (tiles)
				widget.tiles = tiles;
			let infoTiles = await TilesList.create(this, await this.query(widget.elem, '.info_tiles'), InfoTile);
			if (infoTiles)
				widget.infoTiles = infoTiles;

			let transactions = await TransactionList.create(this, await this.query(widget.elem, '.trans_list'));
			if (transactions)
				widget.transList = transactions;

			res.widgets.push(widget);
		}

		return res;
	}


	goToAccounts()
	{
	 	if (!this.content.widgets || !this.content.widgets[App.config.AccountsWidgetPos])
			throw new Error('Accounts widget not found');

		let widget = this.content.widgets[App.config.AccountsWidgetPos];
		if (widget.title != 'Accounts')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}


	goToNewTransactionByAccount(accNum)
	{
		if (!this.content.widgets || !this.content.widgets[App.config.AccountsWidgetPos])
			throw new Error('Wrong state of main view');

		let accWidget = this.content.widgets[App.config.AccountsWidgetPos];
		if (accWidget.title != 'Accounts')
			throw new Error('Wrong state of accounts widget');

		 if (!accWidget.tiles || accWidget.tiles.items.length <= accNum)
			throw new Error('Tile ' + accNum + ' not found');

		let tile = accWidget.tiles.items[accNum];
		let link = tile.linkElem;

		return this.navigation(() => this.click(link));
	}


	goToTransactions()
	{
		if (!this.content || !this.content.widgets || this.content.widgets.length != App.config.widgetsCount)
			throw new Error('Fail to parse main view widgets');

		let widget = this.content.widgets[App.config.LatestWidgetPos];
		if (widget.title != 'Transactions')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}


	goToPersons()
	{
		if (!this.content || !this.content.widgets || this.content.widgets.length != App.config.widgetsCount)
			throw new Error('Fail to parse main view widgets');

		let widget = this.content.widgets[App.config.PersonsWidgetPos];
		if (widget.title != 'Persons')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}


	goToStatistics()
	{
		if (!this.content || !this.content.widgets || this.content.widgets.length != App.config.widgetsCount)
			throw new Error('Fail to parse main view widgets');

		let widget = this.content.widgets[App.config.StatisticsWidgetPos];
		if (widget.title != 'Statistics')
			throw new Error('Wrong widget');

		return this.navigation(() => this.click(widget.linkElem));
	}
}

