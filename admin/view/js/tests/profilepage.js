// Profile page class
function ProfilePage()
{
	ProfilePage.parent.constructor.apply(this, arguments);
}


extend(ProfilePage, TestPage);


ProfilePage.prototype.parseContent = function()
{
	var res = {};

	var blocks = vqueryall('.content_wrap > .profile_block');
	if (blocks.length != 4)
		throw 'Wrong profile page structure';

	res.loginElem = blocks[0].querySelector('span');
	res.nameElem = vge('namestatic');
	res.nameLinkElem = blocks[1].querySelector('div > a');
	res.changePassLinkElem = blocks[2].querySelector('div > a');
	if (!res.loginElem || !res.nameElem || !res.nameLinkElem || !res.changePassLinkElem)
		throw 'Wrong profile page structure';

	res.login = res.loginElem.innerHTML;
	res.name = res.nameElem.innerHTML;

	var buttons = blocks[3].querySelectorAll('input[type="button"]');
	if (!buttons || buttons.length != 3)
		throw 'Wrong profile page structure';
	res.resetBtn = buttons[0];
	res.resetAllBtn = buttons[1];
	res.deleteProfileBtn = buttons[2];

	res.changeNamePopup = {};
	res.changeNamePopup.elem = vge('chname_popup');
	res.changeNamePopup.content = vge('changename');
	res.changeNamePopup.newNameInp = vge('newname');
	if (res.changeNamePopup.elem)
	{
		res.changeNamePopup.okBtn = res.changeNamePopup.elem.querySelector('popup_controls > input.btn.ok_btn');
		res.changeNamePopup.closeBtn = res.changeNamePopup.elem.querySelector('.close_btn > button');
	}

	res.changePassPopup = {};
	res.changePassPopup.elem = vge('chpass_popup');
	res.changePassPopup.content = vge('changepass');
	res.changePassPopup.oldPassInp = vge('oldpwd');
	res.changePassPopup.newPassInp = vge('newpwd');
	if (res.changePassPopup.elem)
	{
		res.changePassPopup.okBtn = res.changePassPopup.elem.querySelector('popup_controls > input.btn.ok_btn');
		res.changePassPopup.closeBtn = res.changePassPopup.elem.querySelector('.close_btn > button');
	}

	res.reset_warning = this.parseWarningPopup(vge('reset_warning'));
	res.delete_warning = this.parseWarningPopup(vge('delete_warning'));

	return res;
};



ProfilePage.prototype.resetAll = function()
{
	if (!this.content.resetAllBtn)
		throw 'Reset all button not found';

	clickEmul(this.content.resetAllBtn);

	this.parse();

	if (!this.content.reset_warning || !this.content.reset_warning.elem || !isVisible(this.content.reset_warning.elem))
		throw 'Warning popup not appear';
	if (!this.content.reset_warning.okBtn)
		throw 'Confirm button not found';

	return navigation(() => clickEmul(this.content.reset_warning.okBtn), ProfilePage);
}
