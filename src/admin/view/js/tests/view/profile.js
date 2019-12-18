if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var hasClass = common.hasClass;
	var idSearch = common.idSearch;
	var isObject = common.isObject;
	var isFunction = common.isFunction;
	var extend = common.extend;

	var TestView = require('./testview.js');
	var LoginView = require('./login.js');
}


// Profile view class
class ProfileView extends TestView
{
	async parseContent()
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
			res.changeNamePopup.okBtn = await this.query(res.changeNamePopup.elem, '.popup_controls > input.btn.ok_btn');
			res.changeNamePopup.closeBtn = await this.query(res.changeNamePopup.elem, '.close_btn > button');
		}

		res.changePassPopup = {};
		res.changePassPopup.elem = await this.query('#chpass_popup');
		res.changePassPopup.content = await this.query('#changepass');
		res.changePassPopup.oldPassInp = await this.query('#oldpwd');
		res.changePassPopup.newPassInp = await this.query('#newpwd');
		if (res.changePassPopup.elem)
		{
			res.changePassPopup.okBtn = await this.query(res.changePassPopup.elem, '.popup_controls > input.btn.ok_btn');
			res.changePassPopup.closeBtn = await this.query(res.changePassPopup.elem, '.close_btn > button');
		}

		res.reset_warning = await this.parseWarningPopup(await this.query('#reset_warning'));
		res.reset_all_warning = await this.parseWarningPopup(await this.query('#reset_all_warning'));
		res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

		return res;
	}


	async changeName(newName)
	{
		await this.performAction(() => this.click(this.content.nameLinkElem));

		await this.performAction(() => this.wait('.popup_content.chname_popup', { visible : true }));

		if (!this.content.changeNamePopup || !(await this.isVisible(this.content.changeNamePopup.elem)))
			throw new Error('Change name popup not appear');

		await this.performAction(() => this.input(this.content.changeNamePopup.newNameInp, newName));
		await this.performAction(() => this.click(this.content.changeNamePopup.okBtn));

		await this.performAction(() => this.wait('.popup_content.msg', { visible : true }));

		if (!this.msgPopup)
			throw new Error('Message popup not found');

		if (!this.msgPopup.success || this.msgPopup.message !== 'User name successfully updated.')
			throw new Error('Fail to update user name');

		await this.performAction(() => this.msgPopup.close());
	}


	async changePassword(oldPass, newPass)
	{
		await this.performAction(() => this.click(this.content.changePassLinkElem));

		await this.performAction(() => this.wait('.popup_content.chpass_popup', { visible : true }));

		if (!this.content.changePassPopup || !(await this.isVisible(this.content.changePassPopup.elem)))
			throw new Error('Change password popup not appear');

		await this.performAction(() => this.input(this.content.changePassPopup.oldPassInp, oldPass));
		await this.performAction(() => this.input(this.content.changePassPopup.newPassInp, newPass));
		await this.performAction(() => this.click(this.content.changePassPopup.okBtn));

		await this.performAction(() => this.wait('.popup_content.msg', { visible : true }));

		if (!this.msgPopup)
			throw new Error('Message popup not found');

		if (!this.msgPopup.success || this.msgPopup.message !== 'Password successfully updated.')
			throw new Error('Fail to update password');

		await this.performAction(() => this.msgPopup.close());
	}


	async resetAccounts()
	{
		let app = this.app;

		if (!this.content.resetBtn)
			throw new Error('Reset accounts button not found');

		await this.performAction(() => this.click(this.content.resetBtn));

		if (!this.content.reset_warning || !this.content.reset_warning.elem || !await this.isVisible(this.content.reset_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.reset_warning.okBtn)
			throw new Error('Confirm button not found');

		await this.navigation(() => this.click(this.content.reset_warning.okBtn));

		// Use view here instead of this because the instance was changed after navigation
		if (!app.view.msgPopup)
			throw new Error('Message popup not found');

		if (!app.view.msgPopup.success || app.view.msgPopup.message !== 'Accounts successfully reseted')
			throw new Error('Fail to reset accounts');

		await app.view.performAction(() => view.msgPopup.close());
	}


	async resetAll()
	{
		let app = this.app;

		if (!this.content.resetAllBtn)
			throw new Error('Reset all button not found');

		await this.performAction(() => this.click(this.content.resetAllBtn));

		if (!this.content.reset_all_warning || !this.content.reset_all_warning.elem || !await this.isVisible(this.content.reset_all_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.reset_all_warning.okBtn)
			throw new Error('Confirm button not found');

		await this.navigation(() => this.click(this.content.reset_all_warning.okBtn));

		// Use view here instead of this because the instance was changed after navigation
		if (!app.view.msgPopup)
			throw new Error('Message popup not found');

		if (!app.view.msgPopup.success || app.view.msgPopup.message !== 'All data successfully reseted.')
			throw new Error('Fail to reset all');

		await app.view.performAction(() => app.view.msgPopup.close());
	}


	async deleteProfile()
	{
		let app = this.app;

		if (!this.content.deleteProfileBtn)
			throw new Error('Delete button not found');

		await this.performAction(() => this.click(this.content.deleteProfileBtn));

		if (!this.content.delete_warning || !this.content.delete_warning.elem || !await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.delete_warning.okBtn)
			throw new Error('Confirm button not found');

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
		if (!(app.view instanceof LoginView))
			throw new Error('Unexpected page');

		// Use view here instead of this because the instance was changed after navigation
		if (!app.view.msgPopup)
			throw new Error('Message popup not found');

		if (!app.view.msgPopup.success || app.view.msgPopup.message !== 'Your profile is successfully deleted.')
			throw new Error('Fail to delete profile');

		await app.view.performAction(() => app.view.msgPopup.close());
	}
}


if (typeof module !== 'undefined' && module.exports)
	module.exports = ProfileView;
