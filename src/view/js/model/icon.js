/**
 * @constructor Icon class
 * @param {*} props 
 */
function Icon()
{
	Icon.parent.constructor.apply(this, arguments);
}

extend(Icon, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Icon.prototype.isAvailField = function(field)
{
    var availFields = ['id', 'name', 'file', 'type'];

    return typeof field === 'string' && availFields.includes(field);
};


/**
 * @constructor IconList class
 * @param {object[]} props - array of icons
 */
function IconList()
{
	IconList.parent.constructor.apply(this, arguments);
}

extend(IconList, List);

/** Static alias for IconList constructor */
IconList.create = function(props)
{
    return new IconList(props);
};


/**
 * Create list item from specified object
 * @param {Object} obj 
 */
IconList.prototype.createItem = function(obj)
{
    return new Icon(obj);
};
