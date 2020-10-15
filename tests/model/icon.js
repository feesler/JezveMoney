import { api } from './api.js';


// Currency object
export class Icon
{
	constructor(props)
	{
		for(let key in props)
		{
			this[key] = props[key];
		}
	}

	static data = null;

	static async getList()
	{
		if (!Array.isArray(this.data))
		{
			let apiResult = await api.icon.list();
			this.data = apiResult.map(item => new Icon(item));
		}

		return this.data;
	}


	static async init()
	{
		await this.getList();
	}


	// Find item by id
	static getItem(item_id)
	{
		if (!Array.isArray(this.data))
			throw new Error('List of icons not initialized');

		let res = this.data.find(item => item.id == item_id);
		if (!res)
			return null;

		return res;
	}


    /**
    * Try to find icon by name string
    * @param {string} name - icon name
    * @return {Icon}
    */
	static findByName(name)
	{
		if (!Array.isArray(this.data))
			throw new Error('List of icons not initialized');

		let qName = name.toUpperCase();
		let res = this.data.find(item => item.name && item.name.toUpperCase() == qName);
		if (!res)
			return null;

		return res;
	}


    /**
    * Try to find icon by title string
    * @param {string} val - icon file name
    * @return {Icon}
    */
	static findByFile(val)
	{
		if (!Array.isArray(this.data))
			throw new Error('List of icons not initialized');

		if (typeof val !== 'string')
			return null;

		let filename = val.toUpperCase();
		let res = this.data.find(item => item.file && item.file.toUpperCase() == filename);
		if (!res)
			return null;

		return res;
	}


	static noIcon()
	{
		return { id : 0, name : 'No icon', file : null, type : null };
	}
}
