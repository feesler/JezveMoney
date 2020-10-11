// Theme constants
var WHITE_THEME = 0;
var DARK_THEME = 1;

/**
 * Header component constructor
 * @param {Object} props 
 */
function Header()
{
	Header.parent.constructor.apply(this, arguments);
}

extend(Header, Component);

/**
 * Create new Header from specified element
 */
Header.create = function()
{
    var res;

    try
    {
        res = new Header();
        res.parse();
    }
    catch(e)
    {
        res = null;
    }

    return res;
};


Header.prototype.parse = function()
{
    this.elem = document.querySelector('.header');
    if (!(this.elem instanceof Element)) {
        throw new Error('Invalid element specified');
    }

    this.menuPopup = ge('menupopup');
	this.userBtn = ge('userbtn');
	if (this.userBtn) {
		this.userBtn.addEventListener('click', this.onUserClick.bind(this));
    }
	this.themeCheck = ge('theme-check');
    if (!this.themeCheck) {
        throw new Error('Invalid structure of header');
    }
	this.themeCheck.addEventListener('change', this.onToggleTheme.bind(this));
    
    this.userNameElem = this.elem.querySelector('.user_title');
    if (this.userNameElem) {
        this.userName = this.userNameElem.textContent;
    }
};


/**
 * User button 'click' event handler
 */
Header.prototype.onUserClick = function()
{
	if (isVisible(this.menuPopup))
	{
		this.hidePopup();
	}
	else
	{
		show(this.menuPopup, true);
		setEmptyClick(this.hidePopup.bind(this), [this.menuPopup, this.userBtn]);
	}
};


/**
 * Hide user menu drop down
 */
Header.prototype.hidePopup = function()
{
	show(this.menuPopup, false);
	setEmptyClick();
};


/**
 * Theme switch 'click' handler
 * @param {Event} e - event object
 */
Header.prototype.onToggleTheme = function(e)
{
	var newTheme = e.target.checked ? DARK_THEME : WHITE_THEME;

	var linkElem = ge('theme-style');
	if (linkElem) {
		linkElem.href = baseURL + 'view/css/' + themes[newTheme];
    }

	ajax.get({
		url : baseURL + 'main/setTheme/?theme=' + newTheme
	});
}


/**
 * Set new user name
 * @param {string} name - user name
 */
Header.prototype.setUserName = function(name)
{
    if (typeof name !== 'string') {
        throw new Error('Invalid name specified');
    }

    if (this.userName == name) {
        return;
    }

    this.userName = name;
	this.userNameElem.textContent = this.userName;
};

