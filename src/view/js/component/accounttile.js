/**
 * Account Tile component constructor
 * @param {object} props 
 */
function AccountTile(props)
{
	AccountTile.parent.constructor.apply(this, arguments);

    this.parent = this.props.parent;
}


extend(AccountTile, Tile);


/**
 * Create new Account Tile from specified element
 */
AccountTile.fromElement = function(props)
{
    var res;

    try
    {
        res = new AccountTile(props);
        res.parse();
    }
    catch(e)
    {
        res = null;
    }

    return res;
};


/**
 * Render specified account
 * @param {object} account - account object
 */
AccountTile.prototype.render = function(account)
{
    if (!isObject(account))
        throw new Error('Invalid account specified');

    var fmtBalance = this.parent.model.currency.formatCurrency(account.balance, account.curr_id);
	var icon = this.parent.model.icons.getItem(account.icon_id);

    this.setTitle(account.name);
    this.setSubTitle(fmtBalance);
    this.setIcon((icon) ? icon.file : null);
};
