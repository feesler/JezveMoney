import { NullableComponent } from './component.js';


export class WarningPopup extends NullableComponent
{
	async parse()
	{
		this.titleElem = await this.query(this.elem, '.popup_title');
		this.title = await this.prop(this.titleElem, 'innerText');
		this.messageElem = await this.query(this.elem, '.popup_message > div');
		this.message = await this.prop(this.messageElem, 'innerText');
		this.okBtn = await this.query(this.elem, '.popup_controls > .btn.ok_btn');
		this.cancelBtn = await this.query(this.elem, '.popup_controls > .btn.cancel_btn');
	}
}
