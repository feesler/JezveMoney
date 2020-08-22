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
		res.tiles = await TilesList.create(this, await this.query('.tiles'), Tile);

		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

		return res;
	}


	// Click on add button and return navigation promise
	async goToCreatePerson()
	{
		return this.navigation(() => this.content.addBtn.click());
	}


	// Select specified person, click on edit button and return navigation promise
	async goToUpdatePerson(num)
	{
		if (!this.content.tiles || this.content.tiles.items.length <= num || num < 0)
			throw new Error('Wrong person number specified');

		await this.content.tiles.items[num].click();

		return this.navigation(() => this.content.toolbar.clickButton('update'));
	}


	async deletePersons(persons)
	{
		if (!persons)
			throw new Error('No persons specified');

		if (!Array.isArray(persons))
			persons = [persons];

		let ind = 0;
		for(let person_num of persons)
		{
			if (person_num < 0 || person_num >= this.content.tiles.items.length)
				throw new Error('Wrong account number');

			await this.performAction(() => this.content.tiles.items[person_num].click());

			let updIsVisible = await this.content.toolbar.isButtonVisible('update');
			if (ind == 0 && !updIsVisible)
				throw new Error('Update button is not visible');
			else if (ind > 0 && updIsVisible)
				throw new Error('Update button is visible while more than one person is selected');

			if (!await this.content.toolbar.isButtonVisible('del'))
				throw new Error('Delete button is not visible');

			ind++;
		}

		await this.performAction(() => this.content.toolbar.clickButton('del'));

		if (!await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Delete account warning popup not appear');

		return this.navigation(() => this.click(this.content.delete_warning.okBtn));
	}


	static render(state)
	{
		let res = {
			values : {
				tiles : TilesList.renderPersons(state.persons.data)
			}
		};

		return res;
	}
}

