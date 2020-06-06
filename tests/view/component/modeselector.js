import { NullableComponent } from './component.js';


export class ModeSelector extends NullableComponent
{
	async parse()
	{
		if (!await this.hasClass(this.elem, 'mode_selector'))
			throw new Error('Unexpected stucture of mode selector control');

		this.listMode = { elem : await this.query(this.elem, '.list_mode') };
		this.detailsMode = { elem : await this.query(this.elem, '.details_mode') };
		if (!this.listMode.elem || !this.detailsMode.elem)
			throw new Error('Unexpected stucture of mode selector control');

		this.listMode.isActive = (await this.prop(this.listMode.elem, 'tagName') == 'B');
		this.detailsMode.isActive = (await this.prop(this.detailsMode.elem, 'tagName') == 'B');
		if ((this.listMode.isActive && this.detailsMode.isActive) ||
			(!this.listMode.isActive && !this.detailsMode.isActive))
			throw new Error('Wrong mode selector state');

		this.details = this.detailsMode.isActive;
	}


	async setDetailsMode()
	{
		if (this.detailsMode.isActive)
			return;

		return this.detailsMode.elem.click();
	}


	async setClassicMode()
	{
		if (this.listMode.isActive)
			return;

		return this.listMode.elem.click();
	}
}
