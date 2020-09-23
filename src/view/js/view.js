/**
 * View constructor
 * 
 */
function View(props)
{
	this.props = copyObject(props);

	onReady(this.onStart.bind(this));
}


View.prototype.onStart = function()
{
};
