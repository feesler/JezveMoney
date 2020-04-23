import { Component } from './component.js';


export class InfoTile extends Component
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem || !await env.hasClass(this.elem, 'info_tile'))
			throw new Error('Wrong info tile structure');

		this.titleEl = await env.query(this.elem, '.info_title');
		this.subtitleEl = await env.query(this.elem, '.info_subtitle');

		this.id = this.parseId(await env.prop(this.elem, 'id'));
		this.title = await env.prop(this.titleEl, 'innerText');
		this.subtitle = await env.prop(this.subtitleEl, 'innerText');
	}
}
