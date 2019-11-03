if (typeof module !== 'undefined' && module.exports)
{
	var _ = require('../../../../../view/js/common.js');
	var hasClass = _.hasClass;
	var isVisible = _.isVisible;
	var idSearch = _.idSearch;
	var isObject = _.isObject;
	var isFunction = _.isFunction;
	var extend = _.extend;

	var TestPage = require('./page.js');
}


// Profile page class
function ProfilePage()
{
	ProfilePage.parent.constructor.apply(this, arguments);
}


extend(ProfilePage, TestPage);


ProfilePage.prototype.parseContent = async function()
{
	var res = {};

	var blocks = await this.queryAll('.content_wrap > .profile_block');
	if (blocks.length != 4)
		throw new Error('Wrong profile page structure');

	res.loginElem = await this.query(blocks[0], 'span');
	res.nameElem = await this.query('#namestatic');
	res.nameLinkElem = await this.query(blocks[1], 'div > a');
	res.changePassLinkElem = await this.query(blocks[2], 'div > a');
	if (!res.loginElem || !res.nameElem || !res.nameLinkElem || !res.changePassLinkElem)
		throw new Error('Wrong profile page structure');

	res.login = res.loginElem.innerText;
	res.name = res.nameElem.innerText;

	var buttons = await this.queryAll(blocks[3], 'input[type="button"]');
	if (!buttons || buttons.length != 3)
		throw new Error('Wrong profile page structure');
	res.resetBtn = buttons[0];
	res.resetAllBtn = buttons[1];
	res.deleteProfileBtn = buttons[2];

	res.changeNamePopup = {};
	res.changeNamePopup.elem = await this.query('#chname_popup');
	res.changeNamePopup.content = await this.query('#changename');
	res.changeNamePopup.newNameInp = await this.query('#newname');
	if (res.changeNamePopup.elem)
	{
		res.changeNamePopup.okBtn = await this.query(res.changeNamePopup.elem, 'popup_controls > input.btn.ok_btn');
		res.changeNamePopup.closeBtn = await this.query(res.changeNamePopup.elem, '.close_btn > button');
	}

	res.changePassPopup = {};
	res.changePassPopup.elem = await this.query('#chpass_popup');
	res.changePassPopup.content = await this.query('#changepass');
	res.changePassPopup.oldPassInp = await this.query('#oldpwd');
	res.changePassPopup.newPassInp = await this.query('#newpwd');
	if (res.changePassPopup.elem)
	{
		res.changePassPopup.okBtn = await this.query(res.changePassPopup.elem, 'popup_controls > input.btn.ok_btn');
		res.changePassPopup.closeBtn = await this.query(res.changePassPopup.elem, '.close_btn > button');
	}

	res.reset_warning = await this.parseWarningPopup(await this.query('#reset_warning'));
	res.reset_all_warning = await this.parseWarningPopup(await this.query('#reset_all_warning'));
	res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

	return res;
};



ProfilePage.prototype.resetAll = function()
{
	return this.performAction(() =>
	{
		if (!this.content.resetAllBtn)
			throw new Error('Reset all button not found');

		return this.click(this.content.resetAllBtn);
	})
	.then(() =>
	{
		if (!this.content.reset_all_warning || !this.content.reset_all_warning.elem || !isVisible(this.content.reset_all_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.reset_all_warning.okBtn)
			throw new Error('Confirm button not found');

		return this.navigation(() => this.click(this.content.reset_all_warning.okBtn));
	})
	// Use page here instead of this because the instance was changed after navigation
	.then(page =>
	{
		if (!page.msgPopup)
			throw new Error('Message popup not found');

		if (!page.msgPopup.success || page.msgPopup.message !== 'All data successfully reseted.')
			throw new Error('Fail to reset all');

		return page.performAction(() => page.msgPopup.close());
	});
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = ProfilePage;
