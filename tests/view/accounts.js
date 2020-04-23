import { TestView } from './testview.js';
import { TilesList } from './component/tileslist.js';
import { Tile } from './component/tile.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';


// List of accounts view class
export class AccountsView extends TestView
{
	async parseContent()
	{
		let res = { titleEl : await this.query('.content_wrap > .heading > h1'),
	 				addBtn : await IconLink.create(this, await this.query('#add_btn')),
					toolbar : {
						elem : await this.query('#toolbar'),
						editBtn : await IconLink.create(this, await this.query('#edit_btn')),
						exportBtn : await IconLink.create(this, await this.query('#export_btn')),
						delBtn : await IconLink.create(this, await this.query('#del_btn'))
					}
				};
		if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.exportBtn || !res.toolbar.delBtn)
			throw new Error('Wrong accounts view structure');

		res.title = this.prop(res.titleEl, 'innerText');
		res.tiles = await TilesList.create(this, await this.query('.tiles'), Tile);

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

		if (!this.content.toolbar.elem || !this.isVisible(this.content.toolbar.elem) ||
			!this.content.toolbar.editBtn || !this.isVisible(this.content.toolbar.editBtn.elem))
			throw new Error('Update account button not visible');

		return this.navigation(() => this.content.toolbar.editBtn.click());
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
			if (acc_num >= this.content.tiles.items.length)
				throw new Error('Wrong account number');

			await this.performAction(() => this.content.tiles.items[acc_num].click());

			let editIsVisible = await this.isVisible(this.content.toolbar.editBtn.elem);
			if (ind == 0 && !editIsVisible)
				throw new Error('Edit button is not visible');
			else if (ind > 0 && editIsVisible)
				throw new Error('Edit button is visible while more than one accounts is selected');

			if (!await this.isVisible(this.content.toolbar.delBtn.elem))
				throw new Error('Delete button is not visible');

			ind++;
		}
	}


	async deselectAccounts()
	{
		let ind = 0;
		for(let acc_num = 0, l = this.content.tiles.items.length; acc_num < l; acc_num++)
		{
			let tile = this.content.tiles.items[acc_num];
			if (tile.isActive)
				await this.performAction(() => this.content.tiles.items[acc_num].click());
		}
	}


	// Delete secified accounts and return navigation promise
	async deleteAccounts(acc)
	{
		await this.selectAccounts(acc);

		await this.performAction(() => this.content.toolbar.delBtn.click());

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Delete account warning popup not appear');

		if (!this.content.delete_warning.okBtn)
			throw new Error('OK button not found');

		return this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	// Export transactions of specified accounts
	async exportAccounts(acc)
	{
		let urlBefore = this.location;
		await this.selectAccounts(acc);

		let downloadURL = await this.prop(this.content.toolbar.exportBtn.linkElem, 'href');

		let exportResp = await this.httpReq('GET', downloadURL);
		if (!exportResp || exportResp.status != 200)
			throw new Error('Invalid response');

		await this.deselectAccounts();

		return exportResp.body;
	}
}
