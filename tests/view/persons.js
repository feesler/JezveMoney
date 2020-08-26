import { TestView } from './testview.js';
import { TilesList } from './component/tileslist.js';
import { Tile } from './component/tile.js';
import { IconLink } from './component/iconlink.js';
import { WarningPopup } from './component/warningpopup.js';
import { Toolbar } from './component/toolbar.js';


// List of persons view class
export class PersonsView extends TestView
{
	async parseContent()
	{
		let res = {
			titleEl : await this.query('.content_wrap > .heading > h1'),
			addBtn : await IconLink.create(this, await this.query('#add_btn')),
			toolbar : await Toolbar.create(this, await this.query('#toolbar')),
		};

		if (!res.titleEl || !res.addBtn || !res.toolbar || !res.toolbar.editBtn || !res.toolbar.delBtn)
			throw new Error('Invalid structure of persons view');

		res.title = this.prop(res.titleEl, 'innerText');
		res.tiles = await TilesList.create(this, await this.query('#tilesContainer'), Tile);
		res.hiddenTiles = await TilesList.create(this, await this.query('#hiddenTilesContainer'), Tile);

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


	// Click on add button and return navigation promise
	async goToCreatePerson()
	{
		return this.navigation(() => this.content.addBtn.click());
	}


	async selectPersons(persons)
	{
		if (typeof persons === 'undefined')
			throw new Error('No persons specified');

		if (!Array.isArray(persons))
			persons = [ persons ];

		let ind = 0;
		let totalTiles = this.content.tiles.items.length + this.content.hiddenTiles.items.length;
		for(let p_num of persons)
		{
			if (p_num < 0 || p_num >= totalTiles)
				throw new Error('Invalid person number');

			if (p_num < this.content.tiles.items.length)
			{
				await this.performAction(() => this.content.tiles.items[p_num].click());
				if (!await this.content.toolbar.isButtonVisible('hide'))
					throw new Error('Hide button is not visible');
			}
			else
			{
				let hiddenNum = p_num - this.content.tiles.items.length;
				await this.performAction(() => this.content.hiddenTiles.items[hiddenNum].click());
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


	// Select specified person, click on edit button and return navigation promise
	async goToUpdatePerson(num)
	{
		await this.selectPersons(num);

		return this.navigation(() => this.content.toolbar.clickButton('update'));
	}


	async deletePersons(persons)
	{
		await this.selectPersons(persons);

		await this.performAction(() => this.content.toolbar.clickButton('del'));

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Delete person(s) warning popup not appear');

		return this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	// Show secified accounts and return navigation promise
	async showPersons(persons, val = true)
	{
		await this.selectPersons(persons);

		return this.navigation(() => this.content.toolbar.clickButton(val ? 'show' : 'hide'));
	}


	// Hide secified accounts and return navigation promise
	async hidePersons(persons)
	{
		return this.showPersons(persons, false);
	}


	static render(state)
	{
		let res = {
			values : {
				tiles : TilesList.renderPersons(state.persons),
				hiddenTiles : TilesList.renderHiddenPersons(state.persons)
			}
		};

		return res;
	}
}

