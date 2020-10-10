/**
 * IconLink component constructor
 * @param {object} props 
 */
function IconLink()
{
	IconLink.parent.constructor.apply(this, arguments);
}

extend(IconLink, Component);

/**
 * Create new IconLink from specified element
 */
IconLink.fromElement = function(props)
{
    var res;

    try
    {
        res = new IconLink(props);
        res.parse();
    }
    catch(e)
    {
        res = null;
    }

    return res;
};


IconLink.prototype.parse = function()
{
    if (!(this.elem instanceof Element)) {
        throw new Error('Invalid element specified');
    }

	this.buttonElem = this.elem.querySelector('button,a');
    if (this.buttonElem && isFunction(this.props.onclick)) {
        this.buttonElem.addEventListener('click', this.props.onclick);
    }
    if (this.buttonElem.tagName === 'A') {
        this.url = this.buttonElem.href;
    }

    this.iconElem = this.buttonElem.querySelector('.iconlink__icon');
    this.contentElem = this.buttonElem.querySelector('.iconlink__content');
    if (!this.contentElem)
        throw new Error('Invalid structure of iconlink element');

    this.titleElem = this.contentElem.querySelector('.iconlink__title');
    if (this.titleElem) {
        this.title = this.titleElem.textContent;
    } else {
        this.title = this.contentElem.textContent;
    }

    this.subtitleElem = this.contentElem.querySelector('.iconlink__subtitle');
    if (this.subtitleElem) {
        this.subtitle = this.subtitleElem.textContent;
    }
};


IconLink.prototype.setTitle = function(title)
{
    if (typeof title !== 'string')
        throw new Error('Invalid title specified');

    if (this.title == title) {
        return;
    }

    this.title = title;
	this.titleElem.textContent = this.title;
};


IconLink.prototype.setURL = function(url)
{
    if (typeof url !== 'string')
        throw new Error('Invalid URL specified');

    if (this.buttonElem.tagName !== 'A')
        return;

    if (this.url == url) {
        return;
    }

    this.url = url;
	this.buttonElem.href = this.url;
};
