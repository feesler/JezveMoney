import { NullableComponent } from './component.js';


export class ModeSelector extends NullableComponent
{
	async parse()
	{
		if (!await this.hasClass(this.elem, 'mode-selector'))
			throw new Error('Unexpected stucture of mode selector control');

		this.listMode = {};
		this.detailsMode = {};

		let modeElements = await this.queryAll(this.elem, '.mode-selector-item');
		for(let elem of modeElements)
		{
			let tagName = await this.prop(elem, 'tagName');
			let text = await this.prop(elem, 'textContent');
			text = text.trim().toLowerCase();

			let modeItem;
			if (text == 'classic')
				modeItem = this.listMode;
			else if (text == 'details')
				modeItem = this.detailsMode;
			else
				throw new Error(`Unknown mode ${text}`);
			
			modeItem.elem = elem;
			modeItem.isActive = (tagName == 'B');
		}

		if (!this.listMode.elem || !this.detailsMode.elem)
			throw new Error('Unexpected stucture of mode selector control');

		if ((this.listMode.isActive && this.detailsMode.isActive) ||
			(!this.listMode.isActive && !this.detailsMode.isActive))
			throw new Error('Invalid state of mode selector');

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
