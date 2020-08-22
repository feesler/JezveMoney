import { TestView } from './testview.js';
import { TilesList } from './component/tileslist.js';
import { Tile } from './component/tile.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';
import { Toolbar } from './component/toolbar.js';


// List of accounts view class
export class AccountsView extends TestView
{
	async parseContent()
	{
		let res = {
			titleEl : await this.query('.content_wrap > .heading > h1'),
			addBtn : await IconLink.create(this, await this.query('#add_btn')),
			toolbar : await Toolbar.create(this, await this.query('#toolbar')),
		};

		if (!res.titleEl || !res.addBtn || !res.toolbar || !res.toolbar.editBtn || !res.toolbar.exportBtn || !res.toolbar.delBtn)
			throw new Error('Invalid structure of accounts view');

		res.title = await this.prop(res.titleEl, 'innerText');
		res.tiles = await TilesList.create(this, await this.query('#tilesContainer'), Tile);
		res.hiddenTiles = await TilesList.create(this, await this.query('#hiddenTilesContainer'), Tile);

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


	// Click on add button and return navigation promise
	goToCreateAccount()
	{
		return this.navigation(() => this.content.addBtn.click());
	}


	// Select specified account, click on edit button and return navigation promise
	async goToUpdateAccount(num)
	{
		await this.selectAccounts(num);

		return this.navigation(() => this.content.toolbar.clickButton('update'));
	}


	async selectAccounts(acc)
	{
		if (typeof acc === 'undefined')
			throw new Error('No accounts specified');

		if (!Array.isArray(acc))
			acc = [ acc ];

		let ind = 0;
		for(let acc_num of acc)
		{
			if (acc_num < 0 || acc_num >= this.content.tiles.items.length + this.content.hiddenTiles.items.length)
				throw new Error('Invalid account number');

			if (acc_num < this.content.tiles.items.length)
			{
				await this.performAction(() => this.content.tiles.items[acc_num].click());
				if (!await this.content.toolbar.isButtonVisible('hide'))
					throw new Error('Hide button is not visible');
			}
			else
			{
				let hiddenAccNum = acc_num - this.content.tiles.items.length;
				await this.performAction(() => this.content.hiddenTiles.items[hiddenAccNum].click());
				if (!await this.content.toolbar.isButtonVisible('show'))
					throw new Error('Show button is not visible');
			}

			let updIsVisible = await this.content.toolbar.isButtonVisible('update');
			if (ind == 0 && !updIsVisible)
				throw new Error('Update button is not visible');
			else if (ind > 0 && updIsVisible)
				throw new Error('Update button is visible while more than one accounts is selected');

			if (!await this.content.toolbar.isButtonVisible('del'))
				throw new Error('Delete button is not visible');

			ind++;
		}
	}


	async deselectAccounts()
	{
		for(let acc_num = 0, l = this.content.tiles.items.length; acc_num < l; acc_num++)
		{
			let tile = this.content.tiles.items[acc_num];
			if (tile.isActive)
				await this.performAction(() => this.content.tiles.items[acc_num].click());
		}

		for(let acc_num = 0, l = this.content.hiddenTiles.items.length; acc_num < l; acc_num++)
		{
			let tile = this.content.hiddenTiles.items[acc_num];
			if (tile.isActive)
				await this.performAction(() => this.content.hiddenTiles.items[acc_num].click());
		}
	}


	// Delete secified accounts and return navigation promise
	async deleteAccounts(acc)
	{
		await this.selectAccounts(acc);

		await this.performAction(() => this.content.toolbar.clickButton('del'));

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Delete account warning popup not appear');

		if (!this.content.delete_warning.okBtn)
			throw new Error('OK button not found');

		return this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	// Show secified accounts and return navigation promise
	async showAccounts(acc)
	{
		await this.selectAccounts(acc);

		return this.navigation(() => this.content.toolbar.clickButton('show'));
	}


	// Hide secified accounts and return navigation promise
	async hideAccounts(acc)
	{
		await this.selectAccounts(acc);

		return this.navigation(() => this.content.toolbar.clickButton('hide'));
	}


	// Export transactions of specified accounts
	async exportAccounts(acc)
	{
		await this.selectAccounts(acc);

		let downloadURL = this.content.toolbar.getButtonLink('export');
		if (!downloadURL)
			throw new Error('Invalid export URL');

		let exportResp = await this.httpReq('GET', downloadURL);
		if (!exportResp || exportResp.status != 200)
			throw new Error('Invalid response');

		await this.deselectAccounts();

		return exportResp.body;
	}


	static render(state)
	{
		let userAccounts = state.accounts.getUserAccounts();

		let res = {
			values : {
				tiles : TilesList.renderAccounts(userAccounts),
				hiddenTiles : TilesList.renderHiddenAccounts(userAccounts)
			}
		};

		return res;
	}
}
