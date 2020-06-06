import { NullableComponent } from './component.js';
import { IconLink } from './iconlink.js';


export class Toolbar extends NullableComponent
{
	async parse()
	{
		if (!this.elem)
			return null;

		this.buttons = {};

		this.editBtn = await IconLink.create(this, await this.query('#edit_btn'));
		if (this.editBtn)
			this.buttons['update'] = this.editBtn;

		this.exportBtn = await IconLink.create(this, await this.query('#export_btn'));
		if (this.exportBtn)
			this.buttons['export'] = this.exportBtn;

		this.delBtn = await IconLink.create(this, await this.query('#del_btn'));
		if (this.delBtn)
			this.buttons['del'] = this.delBtn;
	}


	async checkVisibility(button)
	{
		if (!button)
			return false;

		return this.isVisible(button.elem);
	}


	getItemByName(name)
	{
		const key = name.toLowerCase();
		if (!(key in this.buttons))
			return null;

		return this.buttons[key];
	}


	async isButtonVisible(name)
	{
		return this.checkVisibility(this.getItemByName(name));
	}


	async clickButton(name)
	{
		const button = this.getItemByName(name);
		if (!button)
			throw new Error(`Button ${name} not found`);

		if (!await this.checkVisibility(button))
			throw new Error('Invalid button');

		return button.click();
	}


	getButtonLink(name)
	{
		const button = this.getItemByName(name);
		if (!button || !button.linkElem)
			throw new Error(`Button ${name} not found`);

		return button.link;
	}
}
