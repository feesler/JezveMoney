// Profile page class
function ProfilePage()
{
	ProfilePage.parent.constructor.apply(this, arguments);
}


extend(ProfilePage, TestPage);


ProfilePage.prototype.parseContent = async function()
{
	var res = {};

	var blocks = await vqueryall('.content_wrap > .profile_block');
	if (blocks.length != 4)
		throw new Error('Wrong profile page structure');

	res.loginElem = await vquery(blocks[0], 'span');
	res.nameElem = await vquery('#namestatic');
	res.nameLinkElem = await vquery(blocks[1], 'div > a');
	res.changePassLinkElem = await vquery(blocks[2], 'div > a');
	if (!res.loginElem || !res.nameElem || !res.nameLinkElem || !res.changePassLinkElem)
		throw new Error('Wrong profile page structure');

	res.login = res.loginElem.innerText;
	res.name = res.nameElem.innerText;

	var buttons = await vqueryall(blocks[3], 'input[type="button"]');
	if (!buttons || buttons.length != 3)
		throw new Error('Wrong profile page structure');
	res.resetBtn = buttons[0];
	res.resetAllBtn = buttons[1];
	res.deleteProfileBtn = buttons[2];

	res.changeNamePopup = {};
	res.changeNamePopup.elem = await vquery('#chname_popup');
	res.changeNamePopup.content = await vquery('#changename');
	res.changeNamePopup.newNameInp = await vquery('#newname');
	if (res.changeNamePopup.elem)
	{
		res.changeNamePopup.okBtn = await vquery(res.changeNamePopup.elem, 'popup_controls > input.btn.ok_btn');
		res.changeNamePopup.closeBtn = await vquery(res.changeNamePopup.elem, '.close_btn > button');
	}

	res.changePassPopup = {};
	res.changePassPopup.elem = await vquery('#chpass_popup');
	res.changePassPopup.content = await vquery('#changepass');
	res.changePassPopup.oldPassInp = await vquery('#oldpwd');
	res.changePassPopup.newPassInp = await vquery('#newpwd');
	if (res.changePassPopup.elem)
	{
		res.changePassPopup.okBtn = await vquery(res.changePassPopup.elem, 'popup_controls > input.btn.ok_btn');
		res.changePassPopup.closeBtn = await vquery(res.changePassPopup.elem, '.close_btn > button');
	}

	res.reset_warning = await this.parseWarningPopup(await vquery('#reset_warning'));
	res.reset_all_warning = await this.parseWarningPopup(await vquery('#reset_all_warning'));
	res.delete_warning = await this.parseWarningPopup(await vquery('#delete_warning'));

	return res;
};



ProfilePage.prototype.resetAll = function()
{
	return this.performAction(() =>
	{
		if (!this.content.resetAllBtn)
			throw new Error('Reset all button not found');

		return clickEmul(this.content.resetAllBtn);
	})
	.then(() =>
	{
		if (!this.content.reset_all_warning || !this.content.reset_all_warning.elem || !isVisible(this.content.reset_all_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.reset_all_warning.okBtn)
			throw new Error('Confirm button not found');

		return navigation(() => clickEmul(this.content.reset_all_warning.okBtn), ProfilePage);
	});
};
