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
