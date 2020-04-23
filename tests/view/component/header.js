import { NullableComponent } from './component.js';


export class Header extends NullableComponent
{
	async parse()
	{
		const env = this.parent.props.environment;

		if (!this.elem)
			return;		// no header is ok for login view

		this.logo = {};
		this.logo.elem = await env.query(this.elem, '.logo');
		if (!this.logo.elem)
			throw new Error('Logo element not found');

		this.logo.linkElem = await env.query(this.logo.elem, 'a');
		if (!this.logo.linkElem)
			throw new Error('Logo link element not found');

		this.user = {};
		this.user.elem = await env.query(this.elem, '.userblock');
		if (this.user.elem)
		{
			this.user.menuBtn = await env.query(this.elem, 'button.user_button');
			if (!this.user.menuBtn)
				throw new Error('User button not found');
			let el = await env.query(this.user.menuBtn, '.user_title');
			if (!el)
				throw new Error('User title element not found');
			this.user.name = await env.prop(el, 'innerText');

			this.user.menuEl = await env.query(this.elem, '.usermenu');
			if (!this.user.menuEl)
				throw new Error('Menu element not found');

			this.user.menuItems = [];
			let menuLinks = await env.queryAll(this.user.menuEl, 'ul > li > a');
			for(let i = 0; i < menuLinks.length; i++)
			{
				el = menuLinks[i];
				this.user.menuItems.push({ elem : el, link : await env.prop(el, 'href'), text : await env.prop(el, 'innerText') });
			}

			let itemShift = (this.user.menuItems.length > 2) ? 1 : 0;

			this.user.profileBtn = this.user.menuItems[itemShift].elem;
			this.user.logoutBtn = this.user.menuItems[itemShift + 1].elem;
		}
	}
}