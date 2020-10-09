/**
 * @constructor Base List class
 * @param {object[]} props - array of list items
 */
function List(props)
{
    if (!Array.isArray(props))
        throw new Error('Invalid account list props');
    
    this.data = props.map(this.createItem.bind(this));
}


/** Static alias for List constructor */
List.create = function(props)
{
    return new List(props);
};


/**
 * Create list item from specified object
 * @param {Object} obj 
 */
List.prototype.createItem = function(obj)
{
    return obj;
};


/**
 * Return item with specified id
 * @param {number} item_id - identifier of item to find
 */
List.prototype.getItem = function(item_id)
{
    if (!item_id)
        return null;

    var res = this.data.find(function(item) {
        return item && item.id == item_id
    });

    return (res) ? res : null;
};


/**
 * Return index of item with specified id
 * Return -1 in case item can't be found
 * @param {number} item_id - identifier of item to find
 */
List.prototype.getItemIndex = function(item_id)
{
	return this.data.findIndex(function(item) {
        return item && item.id == item_id
    });
};


/**
 * @constructor ListItem
 * @param {object} props - properties of list item object
 */
function ListItem(props)
{
    if (!isObject(props))
        throw new Error('Invalid list item props');

    for(var prop in props)
    {
        if (this.isAvailField(prop))
            this[prop] = props[prop];
    }
}


/** Static alias for ListItem constructor */
ListItem.create = function(props)
{
    return new ListItem(props)
};


/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ListItem.prototype.isAvailField = function(field)
{
    return true;
};