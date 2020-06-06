import { NullableComponent } from './component.js';


export class SearchForm extends NullableComponent
{
	async parse()
	{
		this.inputElem = await this.query(this.elem, '#search');
		this.submitBtn = await this.query(this.elem, 'button.search_btn');
		if (!this.inputElem || !this.submitBtn)
			throw new Error('unexpected structure of search form');

		this.value = await this.prop(this.inputElem, 'value');
	}


	async input(val)
	{
		return this.environment.input(this.inputElem, val);
	}


	async submit()
	{
		return this.click(this.submitBtn);
	}


	async search(val)
	{
		await this.input(val);

		return this.submit();
	}
}
