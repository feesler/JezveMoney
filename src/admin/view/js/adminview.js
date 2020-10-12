/**
 * Base Admin view
 */
function AdminView()
{
    AdminView.parent.constructor.apply(this, arguments);
}


extend(AdminView, View);


/**
 * Document ready event handler
 */
View.prototype.onReady = function()
{
    this.onStart();
};
