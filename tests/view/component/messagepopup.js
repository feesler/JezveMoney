import { NullableComponent } from './component.js';


export class MessagePopup extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.success = await env.hasClass(this.elem, 'msg_success') &&
						!(await env.hasClass(this.elem, 'msg_error'));

		this.messageElem = await env.query(this.elem, '.popup_message');
		if (!this.messageElem)
			throw new Error('Wrong structure of message popup');

		this.message = await env.prop(this.messageElem, 'innerText');
		this.closeBtn = await env.query(this.elem, '.close_btn > button');

		if (!this.success)
			console.log(`Error popup appear: ${this.message}`);
	}

	async close()
	{
		const env = this.parent.props.environment;
		return env.click(this.closeBtn);
	}
}