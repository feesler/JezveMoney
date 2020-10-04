/**
 * Account Tile component constructor
 * @param {object} props 
 */
function AccountTile(props)
{
	AccountTile.parent.constructor.apply(this, arguments);
}


extend(AccountTile, Tile);


/**
 * Create new Account Tile from specified element
 */
AccountTile.fromElement = function(elem)
{
    var res;

    try
    {
        res = new AccountTile({ elem : elem });
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

    var fmtBalance = formatCurrency(account.balance, account.curr_id);
	var icon = idSearch(icons, account.icon_id);

    this.setTitle(account.name);
    this.setSubTitle(fmtBalance);
    this.setIcon((icon) ? icon.file : null);
};
