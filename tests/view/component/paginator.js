import { NullableComponent } from './component.js';
import { asyncMap } from '../../common.js';


export class Paginator extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		this.items = [];
		this.activeItem = null;

		if (!await env.hasClass(this.elem, 'paginator'))
			throw new Error('Unexpected stucture of paginator control');

		let ellipsisBefore = false;
		let prevPageItem = null;
		let elems = await env.queryAll(this.elem, ':scope > span');
		if (elems.length == 1)
			throw new Error('Single item paginator control');

		let children = await asyncMap(elems, item => env.query(item, ':scope > *'));
		elems.forEach((item, ind) => item.child = children[ind]);

		for(let itemElem of elems)
		{
			// Check element with no child contain ellipsis and skip
			if (!itemElem.child)
			{
				if (await env.prop(itemElem, 'innerText') != '...')
					throw new Error('Unexpected paginator item');

				// Check ellipsis is between two page number items:
				//  - ellipsis can't be first item
				//  - ellipsis can't follow after ellipsis
				if (!this.items.length || ellipsisBefore || !prevPageItem)
					throw new Error('Unexpected placement of paginator ellipsis');

				ellipsisBefore = true;
				continue;
			}

			let item = { elem : itemElem };

			let tagName = await env.prop(itemElem.child, 'tagName');
			if (tagName == 'A')
			{
				item.linkElem = itemElem.child;
				item.link = await env.prop(itemElem.child, 'href');
				item.isActive = false;
			}
			else if (tagName == 'B')
			{
				item.isActive = true;
			}
			else
				throw new Error('Unexpected stucture of paginator control');

			item.title = await env.prop(itemElem.child, 'innerText');
			item.num = parseInt(item.title);
			if (!item.title || isNaN(item.num) || item.num < 1)
				throw new Error('Unexpected title of paginator item');

			// Check correctnes of order
			if ((!this.items.length && item.num != 1) ||										// First item must always be 1
				(this.items.length && (!prevPageItem || item.num <= prevPageItem.num)) ||		// Following items must be greater than previous
				(this.items.length && !ellipsisBefore && item.num != prevPageItem.num + 1))		// Sequential items must increase only by 1
				throw new Error('Unexpected order of paginator item');

			if (item.isActive)
			{
				if (this.activeItem)
					throw new Error('More than one active paginator item');

				this.activeItem = item;
				this.active = item.num;
			}

			item.ind = this.items.length;
			this.items.push(item);
			prevPageItem = item;
			ellipsisBefore = false;
		}

		// Check ellipsis is not the last item
		if (ellipsisBefore)
			throw new Error('Unexpected placement of paginator ellipsis');

		// Check active item present is paginator is visible(2 or more pages)
		if (this.items.length && !this.activeItem)
			throw new Error('Active paginator item not found');

		if (this.items.length)
		{
			this.pages = this.items[this.items.length - 1].num;
		}
		else
		{
			this.pages = 1;
			this.active = 1;
		}
	}


	isFirstPage()
	{
		return (!this.activeItem || this.activeItem.ind == 0);
	}


	isLastPage()
	{
		return (!this.activeItem || this.activeItem.ind == this.items.length - 1);
	}


	async goToFirstPage()
	{
		const env = this.parent.props.environment;

		if (!this.items.length)
			return;

		let item = this.items[0];
		if (item.isActive)
			return;

		return env.click(item.linkElem);
	}


	async goToPrevPage()
	{
		const env = this.parent.props.environment;

		if (this.isFirstPage())
			return;

		let item = this.items[this.activeItem.ind - 1];
		if (item.isActive)
			return;

		return env.click(item.linkElem);
	}


	async goToNextPage()
	{
		const env = this.parent.props.environment;

		if (this.isLastPage())
			return;

		let item = this.items[this.activeItem.ind + 1];
		if (item.isActive)
			return;

		return env.click(item.linkElem);
	}


	async goToLastPage()
	{
		const env = this.parent.props.environment;

		if (!this.items.length)
			return;

		let item = this.items[this.items.length - 1];
		if (item.isActive)
			return;

		return env.click(item.linkElem);
	}
}
