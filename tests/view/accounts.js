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

		res.title = await this.prop(res.titleEl, 'textContent');
		res.tiles = await TilesList.create(this, await this.query('#tilesContainer'), Tile);
		res.hiddenTiles = await TilesList.create(this, await this.query('#hiddenTilesContainer'), Tile);

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


    getItems()
    {
        let visibleItems = this.content.tiles.getItems();
        let hiddenItems = this.content.hiddenTiles.getItems();

        return visibleItems.concat(hiddenItems);
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

        let visibleTiles = this.content.tiles.items.length;
        let hiddenTiles = this.content.hiddenTiles.items.length;
		let totalTiles = visibleTiles + hiddenTiles;
        let activeTiles = this.content.tiles.getActive();
        let activeHiddenTiles = this.content.hiddenTiles.getActive();
        let selectedCount = activeTiles.length;
        let selectedHiddenCount = activeHiddenTiles.length;
		for(let num of acc)
		{
			if (num < 0 || num >= totalTiles)
				throw new Error('Invalid account number');

			if (num < visibleTiles)
			{
                let item = this.content.tiles.items[num];
                let isSelected = item.isActive;
				await this.performAction(() => item.click());
                selectedCount += (isSelected ? -1 : 1);
			}
			else
			{
				let item = this.content.hiddenTiles.items[num - visibleTiles];
                let isSelected = item.isActive;
				await this.performAction(() => item.click());
                selectedHiddenCount += (isSelected ? -1 : 1);
			}

            let showIsVisible = await this.content.toolbar.isButtonVisible('show');
            if ((selectedHiddenCount > 0) != showIsVisible)
				throw new Error(`Unexpected visibility (${showIsVisible}) of Show button while ${selectedHiddenCount} hidden items selected`);

            let hideIsVisible = await this.content.toolbar.isButtonVisible('hide');
            if ((selectedCount > 0) != hideIsVisible)
				throw new Error(`Unexpected visibility (${hideIsVisible}) of Hide button while ${selectedCount} visible items selected`);

            let totalSelected = selectedCount + selectedHiddenCount;
			let updIsVisible = await this.content.toolbar.isButtonVisible('update');
			if ((totalSelected == 1) != updIsVisible)
				throw new Error(`Unexpected visibility (${updIsVisible}) of Update button while ${totalSelected} items selected`);

			let exportIsVisible = await this.content.toolbar.isButtonVisible('export');
			if ((totalSelected > 0) != exportIsVisible)
				throw new Error(`Unexpected visibility (${exportIsVisible}) of Export button while ${totalSelected} items selected`);

			let delIsVisible = await this.content.toolbar.isButtonVisible('del');
			if ((totalSelected > 0) != delIsVisible)
				throw new Error(`Unexpected visibility (${delIsVisible}) of Delete button while ${totalSelected} items selected`);
		}
	}


	async deselectAccounts()
	{
		let visibleActive = this.content.tiles.getSelectedIndexes();
		let hiddenActive = this.content.hiddenTiles.getSelectedIndexes()
                                .map(ind => ind + this.content.tiles.length);
        let selected = visibleActive.concat(hiddenActive);
		if (selected.length > 0)
			await this.performAction(() => this.selectAccounts(selected));
	}


	// Delete secified accounts and return navigation promise
	async deleteAccounts(acc)
	{
		await this.selectAccounts(acc);

		await this.performAction(() => this.content.toolbar.clickButton('del'));

		if (!this.content.delete_warning || !await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Delete account warning popup not appear');

		if (!this.content.delete_warning.okBtn)
			throw new Error('OK button not found');

		return this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	// Show secified accounts and return navigation promise
	async showAccounts(acc, val = true)
	{
		await this.selectAccounts(acc);

		return this.navigation(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
	}


	// Hide secified accounts and return navigation promise
	async hideAccounts(acc)
	{
		return this.showAccounts(acc, false);
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
