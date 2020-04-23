import { NullableComponent } from './component.js';


export class ModeSelector extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!await env.hasClass(this.elem, 'mode_selector'))
			throw new Error('Unexpected stucture of mode selector control');

		this.listMode = { elem : await env.query(this.elem, '.list_mode') };
		this.detailsMode = { elem : await env.query(this.elem, '.details_mode') };
		if (!this.listMode.elem || !this.detailsMode.elem)
			throw new Error('Unexpected stucture of mode selector control');

		this.listMode.isActive = (await env.prop(this.listMode.elem, 'tagName') == 'B');
		this.detailsMode.isActive = (await env.prop(this.detailsMode.elem, 'tagName') == 'B');
		if ((this.listMode.isActive && this.detailsMode.isActive) ||
			(!this.listMode.isActive && !this.detailsMode.isActive))
			throw new Error('Wrong mode selector state');

		this.details = this.detailsMode.isActive;
	}
}
