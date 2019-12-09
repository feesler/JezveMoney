if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;
	var isArray = common.isArray;

	var TestView = require('./testview.js');
}


// List of persons view class
function PersonsView()
{
	PersonsView.parent.constructor.apply(this, arguments);
}


extend(PersonsView, TestView);


PersonsView.prototype.parseContent = async function()
{
	var res = { titleEl : await this.query('.content_wrap > .heading > h1'),
 				addBtn : await this.parseIconLink(await this.query('#add_btn')),
				toolbar : {
					elem : await this.query('#toolbar'),
					editBtn : await this.parseIconLink(await this.query('#edit_btn')),
					delBtn : await this.parseIconLink(await this.query('#del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn.elem || !res.toolbar.delBtn.elem)
		throw new Error('Wrong persons view structure');

	res.title = this.prop(res.titleEl, 'innerText');
	res.tiles = await this.parseTiles(await this.query('.tiles'));

	res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

	return res;
};


// Click on add button and return navigation promise
PersonsView.prototype.goToCreatePerson = function()
{
	return this.navigation(() => this.content.addBtn.click());
};


// Select specified person, click on edit button and return navigation promise
PersonsView.prototype.goToUpdatePerson = async function(num)
{
	if (!this.content.tiles || this.content.tiles.items.length <= num || num < 0)
		throw new Error('Wrong person number specified');

	await this.content.tiles.items[num].click();

	if (!this.content.toolbar.elem || !await this.isVisible(this.content.toolbar.elem) ||
		!this.content.toolbar.editBtn || !await this.isVisible(this.content.toolbar.editBtn.elem))
		throw new Error('Update person button not visible');

	return this.navigation(() => this.content.toolbar.editBtn.click());
};


PersonsView.prototype.deletePersons = async function(persons)
{
	if (!persons)
		throw new Error('No persons specified');

	if (!isArray(persons))
		persons = [persons];

	let ind = 0;
	for(let person_num of persons)
	{
		if (person_num < 0 || person_num >= this.content.tiles.items.length)
			throw new Error('Wrong account number');

		await this.performAction(() => this.content.tiles.items[person_num].click());

		let editIsVisible = await this.isVisible(this.content.toolbar.editBtn.elem);
		if (ind == 0 && !editIsVisible)
			throw new Error('Edit button is not visible');
		else if (ind > 0 && editIsVisible)
			throw new Error('Edit button is visible while more than one person is selected');

		if (!await this.isVisible(this.content.toolbar.delBtn.elem))
			throw new Error('Delete button is not visible');

		ind++;
	}

	await this.performAction(() => this.content.toolbar.delBtn.click());

	if (!await this.isVisible(this.content.delete_warning.elem))
		throw new Error('Delete account warning popup not appear');

	return this.navigation(() => this.click(this.content.delete_warning.okBtn));
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = PersonsView;
