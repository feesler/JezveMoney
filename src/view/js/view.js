/**
 * View constructor
 */
function View(props)
{
	if (typeof props === 'undefined')
		this.props = {};
	else
		this.props = copyObject(props);

	onReady(this.onStart.bind(this));
}


View.prototype.onStart = function()
{
};


/**
 * Clear validation state of block
 * @param {string|Element} block - block to clear validation state
 */
View.prototype.clearBlockValidation = function(block)
{
	var blockElem = (typeof block === 'string') ? ge(block) : block;
	if (blockElem && blockElem.classList)
		blockElem.classList.remove('invalid-block');
};


/**
 * Set invalid state for block
 * @param {string|Element} block - block to invalidate
 */
View.prototype.invalidateBlock = function(block)
{
	var blockElem = (typeof block === 'string') ? ge(block) : block;
	if (blockElem && blockElem.classList)
		blockElem.classList.add('invalid-block');
};