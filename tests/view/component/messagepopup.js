import { NullableComponent } from './component.js';


export class MessagePopup extends NullableComponent
{
	async parse()
	{
		this.success = await this.hasClass(this.elem, 'msg_success') &&
						!(await this.hasClass(this.elem, 'msg_error'));

		this.messageElem = await this.query(this.elem, '.popup__message');
		if (!this.messageElem)
			throw new Error('Wrong structure of message popup');

		this.message = await this.prop(this.messageElem, 'textContent');
		this.message = this.message.trim();
		this.closeBtn = await this.query(this.elem, '.close-btn');

		if (!this.success)
			console.log(`Error popup appear: ${this.message}`);
	}

	async close()
	{
		return this.click(this.closeBtn);
	}
}