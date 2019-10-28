// List of persons page class
function PersonsPage()
{
	PersonsPage.parent.constructor.apply(this, arguments);
}


extend(PersonsPage, TestPage);


PersonsPage.prototype.parseContent = async function()
{
	var res = { titleEl : await vquery('.content_wrap > .heading > h1'),
 				addBtn : await this.parseIconLink(await vquery('#add_btn')),
				toolbar : {
					elem : await vquery('#toolbar'),
					editBtn : await this.parseIconLink(await vquery('#edit_btn')),
					delBtn : await this.parseIconLink(await vquery('#del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn.elem || !res.toolbar.delBtn.elem)
		throw new Error('Wrong persons page structure');

	res.title = res.titleEl.innerText;
	res.tiles = await this.parseTiles(await vquery('.tiles'));

	res.delete_warning = await this.parseWarningPopup(await vquery('#delete_warning'));

	return res;
};


// Click on add button and return navigation promise
PersonsPage.prototype.goToCreatePerson = function()
{
	return navigation(() => this.content.addBtn.click(), PersonPage);
};


// Select specified person, click on edit button and return navigation promise
PersonsPage.prototype.goToUpdatePerson = async function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw new Error('Wrong person number specified');

	await this.content.tiles[num].click();

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.toolbar.editBtn || !isVisible(this.content.toolbar.editBtn.elem))
		throw new Error('Update person button not visible');

	return navigation(() => this.content.toolbar.editBtn.click(), PersonPage);
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
				.then(() =>
				{
					var editIsVisible = isVisible(this.content.toolbar.editBtn.elem);
					if (ind == 0 && !editIsVisible)
						throw new Error('Edit button is not visible');
					else if (ind > 0 && editIsVisible)
						throw new Error('Edit button is visible while more than one person is selected');

					if (!isVisible(this.content.toolbar.delBtn.elem))
						throw new Error('Delete button is not visible');

					return Promise.resolve();
				});
	}, Promise.resolve());

	return selectPromise
			.then(() => this.performAction(() => this.content.toolbar.delBtn.click()))
			.then(() =>
			{
				if (!isVisible(this.content.delete_warning.elem))
					throw new Error('Delete account warning popup not appear');

				return navigation(() => clickEmul(this.content.delete_warning.okBtn), PersonsPage);
			});
};
