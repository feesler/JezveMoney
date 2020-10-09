/**
 * TileInfoItem component constructor
 * @param {object} props 
 */
function TileInfoItem(props)
{
	if (typeof props === 'undefined')
		this.props = {};
	else
		this.props = props;

    if (typeof this.props.elem === 'string')
        this.elem = ge(this.props.elem);
    else
        this.elem = this.props.elem;
}


/**
 * Create new TileInfoItem from specified element
 */
TileInfoItem.fromElement = function(props)
{
    var res;

    try
    {
        res = new TileInfoItem(props);
        res.parse();
    }
    catch(e)
    {
        res = null;
    }

    return res;
};


TileInfoItem.prototype.parse = function()
{
    if (!(this.elem instanceof Element)) {
        throw new Error('Invalid element specified');
    }

	this.buttonElem = this.elem.querySelector('button');
    if (this.buttonElem && isFunction(this.props.onclick)) {
        this.buttonElem.addEventListener('click', this.props.onclick);
    }

    this.titleElem = this.buttonElem.querySelector('span');
    if (this.titleElem) {
        this.title = this.titleElem.textContent;
    }
};


TileInfoItem.prototype.setTitle = function(title)
{
    if (typeof title !== 'string')
        throw new Error('Invalid title specified');

    if (this.title == title) {
        return;
    }

    this.title = title;
	this.titleElem.textContent = this.title;
};