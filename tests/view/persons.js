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

		res.title = this.prop(res.titleEl, 'textContent');
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

        let visibleTiles = this.content.tiles.items.length;
        let hiddenTiles = this.content.hiddenTiles.items.length;
		let totalTiles = visibleTiles + hiddenTiles;
        let activeTiles = this.content.tiles.getActive();
        let activeHiddenTiles = this.content.hiddenTiles.getActive();
        let selectedCount = activeTiles.length;
        let selectedHiddenCount = activeHiddenTiles.length;
		for(let num of persons)
		{
			if (num < 0 || num >= totalTiles)
				throw new Error('Invalid person number');

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

			let delIsVisible = await this.content.toolbar.isButtonVisible('del');
			if ((totalSelected > 0) != delIsVisible)
				throw new Error(`Unexpected visibility (${delIsVisible}) of Delete button while ${totalSelected} items selected`);
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

		if (!this.content.delete_warning || !await this.isVisible(this.content.delete_warning.elem))
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

