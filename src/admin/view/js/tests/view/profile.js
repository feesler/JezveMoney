if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var hasClass = common.hasClass;
	var idSearch = common.idSearch;
	var isObject = common.isObject;
	var isFunction = common.isFunction;
	var extend = common.extend;

	var TestView = require('./testview.js');
}


// Profile view class
function ProfileView()
{
	ProfileView.parent.constructor.apply(this, arguments);
}


extend(ProfileView, TestView);


ProfileView.prototype.parseContent = async function()
{
	var res = {};

	var blocks = await this.queryAll('.content_wrap > .profile_block');
	if (blocks.length != 4)
		throw new Error('Wrong profile view structure');

	res.loginElem = await this.query(blocks[0], 'span');
	res.nameElem = await this.query('#namestatic');
	res.nameLinkElem = await this.query(blocks[1], 'div > a');
	res.changePassLinkElem = await this.query(blocks[2], 'div > a');
	if (!res.loginElem || !res.nameElem || !res.nameLinkElem || !res.changePassLinkElem)
		throw new Error('Wrong profile view structure');

	res.login = res.loginElem.innerText;
	res.name = res.nameElem.innerText;

	var buttons = await this.queryAll(blocks[3], 'input[type="button"]');
	if (!buttons || buttons.length != 3)
		throw new Error('Wrong profile view structure');
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


ProfileView.prototype.resetAccounts = async function()
{
	if (!this.content.resetBtn)
		throw new Error('Reset accounts button not found');

	await this.performAction(() => this.click(this.content.resetBtn));

	if (!this.content.reset_warning || !this.content.reset_warning.elem || !await this.isVisible(this.content.reset_warning.elem))
		throw new Error('Warning popup not appear');
	if (!this.content.reset_warning.okBtn)
		throw new Error('Confirm button not found');

	let view = await this.navigation(() => this.click(this.content.reset_warning.okBtn));

	// Use view here instead of this because the instance was changed after navigation
	if (!view.msgPopup)
		throw new Error('Message popup not found');

	if (!view.msgPopup.success || view.msgPopup.message !== 'Accounts successfully reseted')
		throw new Error('Fail to reset accounts');

	return view.performAction(() => view.msgPopup.close());
};


ProfileView.prototype.resetAll = async function()
{
	if (!this.content.resetAllBtn)
		throw new Error('Reset all button not found');

	await this.performAction(() => this.click(this.content.resetAllBtn));

	if (!this.content.reset_all_warning || !this.content.reset_all_warning.elem || !await this.isVisible(this.content.reset_all_warning.elem))
		throw new Error('Warning popup not appear');
	if (!this.content.reset_all_warning.okBtn)
		throw new Error('Confirm button not found');

	let view = await this.navigation(() => this.click(this.content.reset_all_warning.okBtn));

	// Use view here instead of this because the instance was changed after navigation
	if (!view.msgPopup)
		throw new Error('Message popup not found');

	if (!view.msgPopup.success || view.msgPopup.message !== 'All data successfully reseted.')
		throw new Error('Fail to reset all');

	return view.performAction(() => view.msgPopup.close());
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = ProfileView;
