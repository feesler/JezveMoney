import { NullableComponent } from './component.js';


export class WarningPopup extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.titleElem = await env.query(this.elem, '.popup_title');
		this.title = await env.prop(this.titleElem, 'innerText');
		this.messageElem = await env.query(this.elem, '.popup_message > div');
		this.message = await env.prop(this.messageElem, 'innerText');
		this.okBtn = await env.query(this.elem, '.popup_controls > .btn.ok_btn');
		this.cancelBtn = await env.query(this.elem, '.popup_controls > .btn.cancel_btn');
	}
}
