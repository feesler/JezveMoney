/** Person flags */
var PERSON_HIDDEN = 1;


/**
 * @constructor Person class
 * @param {*} props 
 */
function Person(props)
{
    if (!isObject(props))
        throw new Error('Invalid Account props');

    for(var prop in props)
    {
        if (this.isAvailField(prop))
            this[prop] = props[prop];
    }
}


/** Static alias for Person constructor */
Person.create = function(props)
{
    return new Person(props)
};


/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Person.prototype.isAvailField = function(field)
{
    var availFields = ['id', 'name', 'flags', 'accounts'];

    return typeof field === 'string' && availFields.includes(field);
};


/**
 * Check person is not hidden
 */
Person.prototype.isVisible = function()
{
	if (!('flags' in this))
		throw new Error('Invalid person');

	return (this.flags & PERSON_HIDDEN) == 0;
};


/**
 * @constructor PersonList class
 * @param {object[]} props - array of persons
 */
function PersonList(props)
{
    if (!Array.isArray(props))
        throw new Error('Invalid person list props');
    
    this.data = props.map(Person.create);
}


/** Static alias for PersonList constructor */
PersonList.create = function(props)
{
    return new PersonList(props);
};


/**
 * Return list of visible Persons
 */
PersonList.prototype.getVisible = function()
{
    var res = this.data.filter(function(item) {
        return item && item.isVisible();
    });

    return (res) ? res : null;
};


/**
 * Return item with specified id
 * @param {number} item_id - identifier of item to find
 */
PersonList.prototype.getItem = function(item_id)
{
    return this.data.find(function(item) {
        return item && item.id == item_id
    });
};
