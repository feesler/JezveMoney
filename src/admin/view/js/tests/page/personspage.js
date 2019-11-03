if (typeof module !== 'undefined' && module.exports)
{
	const _ = require('../../../../../view/js/common.js');
	var extend = _.extend;
	var isArray = _.isArray;

	var TestPage = require('./page.js');
}


// List of persons page class
function PersonsPage()
{
	PersonsPage.parent.constructor.apply(this, arguments);
}


extend(PersonsPage, TestPage);


PersonsPage.prototype.parseContent = async function()
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
		throw new Error('Wrong persons page structure');

	res.title = this.prop(res.titleEl, 'innerText');
	res.tiles = await this.parseTiles(await this.query('.tiles'));

	res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

	return res;
};


// Click on add button and return navigation promise
PersonsPage.prototype.goToCreatePerson = function()
{
	return this.navigation(() => this.content.addBtn.click());
};


// Select specified person, click on edit button and return navigation promise
PersonsPage.prototype.goToUpdatePerson = async function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw new Error('Wrong person number specified');

	await this.content.tiles[num].click();

	if (!this.content.toolbar.elem || !await this.isVisible(this.content.toolbar.elem) ||
		!this.content.toolbar.editBtn || !await this.isVisible(this.content.toolbar.editBtn.elem))
		throw new Error('Update person button not visible');

	return this.navigation(() => this.content.toolbar.editBtn.click());
};


PersonsPage.prototype.deletePersons = function(persons)
{
	if (!persons)
		throw new Error('No persons specified');

	if (!isArray(persons))
		persons = [persons];

	let selectPromise = persons.reduce((prev, person_num, ind) =>
	{
		return prev
				.then(() => this.performAction(() =>
				{
					if (person_num >= this.content.tiles.length)
						throw new Error('Wrong account number');

					return this.content.tiles[person_num].click();
				}))
				.then(async () =>
				{
					let editIsVisible = await this.isVisible(this.content.toolbar.editBtn.elem);
					if (ind == 0 && !editIsVisible)
						throw new Error('Edit button is not visible');
					else if (ind > 0 && editIsVisible)
						throw new Error('Edit button is visible while more than one person is selected');

					if (!await this.isVisible(this.content.toolbar.delBtn.elem))
						throw new Error('Delete button is not visible');
				});
	}, Promise.resolve());

	return selectPromise
			.then(() => this.performAction(() => this.content.toolbar.delBtn.click()))
			.then(async () =>
			{
				if (!await this.isVisible(this.content.delete_warning.elem))
					throw new Error('Delete account warning popup not appear');

				return this.navigation(() => this.click(this.content.delete_warning.okBtn));
			});
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = PersonsPage;
