// List of persons page class
function PersonsPage()
{
	PersonsPage.parent.constructor.apply(this, arguments);
}


extend(PersonsPage, TestPage);


PersonsPage.prototype.parseContent = function()
{
	var res = { titleEl : vquery('.content_wrap > .heading > h1'),
 				addBtn : this.parseIconLink(vge('add_btn')),
				toolbar : {
					elem : vge('toolbar'),
					editBtn : this.parseIconLink(vge('edit_btn')),
					delBtn : this.parseIconLink(vge('del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn.elem || !res.toolbar.delBtn.elem)
		throw 'Wrong persons page structure';

	res.title = res.titleEl.innerHTML;
	res.tiles = this.parseTiles(vquery('.tiles'));

	res.delete_warning = this.parseWarningPopup(vge('delete_warning'));

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
		throw 'Wrong person number specified';

	var tile = this.content.tiles[num];

	clickEmul(tile.linkElem);

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.toolbar.editBtn || !isVisible(this.content.toolbar.editBtn.elem))
		throw 'Update person button not visible';

	return navigation(() => this.content.toolbar.editBtn.click(), PersonPage);
}
