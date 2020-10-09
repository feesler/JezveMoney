/**
 * @constructor Icon class
 * @param {*} props 
 */
function Icon(props)
{
    if (!isObject(props))
        throw new Error('Invalid Icon props');

    for(var prop in props)
    {
        if (this.isAvailField(prop))
            this[prop] = props[prop];
    }
}


/** Static alias for Icon constructor */
Icon.create = function(props)
{
    return new Icon(props)
};


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
 * @param {object[]} props - array of currencies
 */
function IconList(props)
{
    if (!Array.isArray(props))
        throw new Error('Invalid icon list props');
    
    this.data = props.map(Icon.create);
}


/** Static alias for IconList constructor */
IconList.create = function(props)
{
    return new IconList(props);
};


/**
 * Return item with specified id
 * @param {number} item_id - identifier of item to find
 */
IconList.prototype.getItem = function(item_id)
{
    if (!item_id)
        return null;

    var res = this.data.find(function(item) {
        return item && item.id == item_id
    });

    return (res) ? res : null;
};

