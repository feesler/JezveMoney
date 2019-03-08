// List of persons page class
function PersonsPage()
{
	PersonsPage.parent.constructor.apply(this, arguments);
}


extend(PersonsPage, TestPage);


PersonsPage.prototype.parseContent = function()
{
	var res = { titleEl : vquery('.content_wrap > .heading > h1'),
 				addBtn : vquery('#add_btn > a'),
				toolbar : {
					elem : vge('toolbar'),
					editBtnElem : vquery('#edit_btn'),
					delBtnElem : vquery('#del_btn')
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtnElem || !res.toolbar.delBtnElem)
		throw 'Wrong persons page structure';

	res.editBtn = res.toolbar.editBtnElem.firstElementChild;
	res.delBtn = res.toolbar.delBtnElem.firstElementChild;

	res.title = res.titleEl.innerHTML;
	res.tiles = this.parseTiles(vquery('.tiles'));

	res.delete_warning = this.parseWarningPopup(vge('delete_warning'));

	return res;
};


// Click on add button and return navigation promise
PersonsPage.prototype.goToCreatePerson = function()
{
	return navigation(() => clickEmul(this.content.addBtn), PersonPage);
};


// Select specified person, click on edit button and return navigation promise
PersonsPage.prototype.goToUpdatePerson = function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw 'Wrong person number specified';

	var tile = this.content.tiles[num];

	clickEmul(tile.linkElem);

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.editBtn || !isVisible(this.content.toolbar.editBtnElem))
		throw 'Update person button not visible';

	return navigation(() => clickEmul(this.content.editBtn), PersonPage);
}
