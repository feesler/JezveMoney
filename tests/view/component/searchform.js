import { NullableComponent } from './component.js';


export class SearchForm extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.inputElem = await env.query(this.elem, '#search');
		this.submitBtn = await env.query(this.elem, 'button.search_btn');
		if (!this.inputElem || !this.submitBtn)
			throw new Error('unexpected structure of search form');

		this.value = await env.prop(this.inputElem, 'value');
	}


	async input(val)
	{
		const env = this.parent.props.environment;

		return env.input(this.inputElem, val);
	}


	async submit()
	{
		const env = this.parent.props.environment;

		return env.click(this.submitBtn);
	}
}
