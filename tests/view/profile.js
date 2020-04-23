import { TestView } from './testview.js';
import { LoginView } from './login.js';
import { App } from '../app.js';
import { WarningPopup } from './component/warningpopup.js';


// Profile view class
export class ProfileView extends TestView
{
	async parseContent()
	{
		let res = {};

		let blocks = await this.queryAll('.content_wrap > .profile_block');
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

		let buttons = await this.queryAll(blocks[3], 'input[type="button"]');
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

		res.reset_warning = await WarningPopup.create(this, await this.query('#reset_warning'));
		res.reset_all_warning = await WarningPopup.create(this, await this.query('#reset_all_warning'));
		res.delete_warning = await WarningPopup.create(this, await this.query('#delete_warning'));

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
	}


	async resetAccounts()
	{
		if (!this.content.resetBtn)
			throw new Error('Reset accounts button not found');

		await this.performAction(() => this.click(this.content.resetBtn));

		if (!this.content.reset_warning || !this.content.reset_warning.elem || !await this.isVisible(this.content.reset_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.reset_warning.okBtn)
			throw new Error('Confirm button not found');

		await this.navigation(() => this.click(this.content.reset_warning.okBtn));
	}


	async resetAll()
	{
		if (!this.content.resetAllBtn)
			throw new Error('Reset all button not found');

		await this.performAction(() => this.click(this.content.resetAllBtn));

		if (!this.content.reset_all_warning || !this.content.reset_all_warning.elem || !await this.isVisible(this.content.reset_all_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.reset_all_warning.okBtn)
			throw new Error('Confirm button not found');

		await this.navigation(() => this.click(this.content.reset_all_warning.okBtn));
	}


	async deleteProfile()
	{
		if (!this.content.deleteProfileBtn)
			throw new Error('Delete button not found');

		await this.performAction(() => this.click(this.content.deleteProfileBtn));

		if (!this.content.delete_warning || !this.content.delete_warning.elem || !await this.isVisible(this.content.delete_warning.elem))
			throw new Error('Warning popup not appear');
		if (!this.content.delete_warning.okBtn)
			throw new Error('Confirm button not found');

		await this.navigation(() => this.click(this.content.delete_warning.okBtn));
		if (!(App.view instanceof LoginView))
			throw new Error('Unexpected page');
	}
}

