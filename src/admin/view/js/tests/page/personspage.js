// List of persons page class
function PersonsPage()
{
	PersonsPage.parent.constructor.apply(this, arguments);
}


extend(PersonsPage, TestPage);


PersonsPage.prototype.parseContent = function()
{
	var res = { titleEl : vquery('.content_wrap > .heading > h1'),
 				addBtn : this.parseIconLink(vquery('#add_btn')),
				toolbar : {
					elem : vquery('#toolbar'),
					editBtn : this.parseIconLink(vquery('#edit_btn')),
					delBtn : this.parseIconLink(vquery('#del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn.elem || !res.toolbar.delBtn.elem)
		throw new Error('Wrong persons page structure');

	res.title = res.titleEl.innerText;
	res.tiles = this.parseTiles(vquery('.tiles'));

	res.delete_warning = this.parseWarningPopup(vquery('#delete_warning'));

	return res;
};


// Click on add button and return navigation promise
PersonsPage.prototype.goToCreatePerson = function()
{
	return navigation(() => this.content.addBtn.click(), PersonPage);
};


// Select specified person, click on edit button and return navigation promise
PersonsPage.prototype.goToUpdatePerson = function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw new Error('Wrong person number specified');

	this.content.tiles[num].click();

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

					this.content.tiles[person_num].click();

					return Promise.resolve();
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
