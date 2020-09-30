/**
 * Admin icon list view
 */
function AdminIconListView()
{
    AdminIconListView.parent.constructor.apply(this, arguments);

    this.apiController = 'icon';
}


extend(AdminIconListView, AdminListView);


/**
 * View initialization
 */
AdminIconListView.prototype.onStart = function()
{
    AdminIconListView.parent.onStart.apply(this, arguments);

	this.idInput = ge('icon_id');
	this.nameInput = ge('icon_name');
	this.fileInput = ge('icon_file');
	this.typeSelect = ge('icon_type');
};


/**
 * Set up fields of form for specified item
 * @param {*} item - object to set up dialog for. if set to null create mode is assumed, if set to object then update mode
 */
AdminIconListView.prototype.setItemValues = function(item)
{
	if (item)
	{
		this.idInput.value = item.id;
		this.nameInput.value = item.name;
		this.fileInput.value = item.file;
        selectByValue(this.typeSelect, item.type);
	}
	else			// clean
	{
		this.idInput.value = '';
		this.nameInput.value = '';
		this.fileInput.value = '';
		selectByValue(this.typeSelect, 0);
	}
};


/**
 * Render list element for specified item
 * @param {object} item - item object
 */
AdminIconListView.prototype.renderItem = function(item)
{
    if (!item)
        return null;

    return ce('tr', {}, [
                ce('td', { textContent : item.id }),
                ce('td', { textContent : item.name }),
                ce('td', { textContent : item.file }),
                ce('td', { textContent : item.type }),
            ]);
};