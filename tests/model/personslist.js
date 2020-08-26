import { List } from "./list.js";
import { api } from './api.js';
import { copyObject } from "../common.js";


export const PERSON_HIDDEN = 1;


export class PersonsList extends List
{
	async fetch()
	{
		return api.person.list();
	}


	clone()
	{
		let res = new PersonsList(this.data);
		res.autoincrement = this.autoincrement;

		return res;
	}


	findByName(name, caseSens = false)
	{
		let lookupName, res;

		if (caseSens)
		{
			lookupName = name;
			res = this.data.find(item => item.name == lookupName);
		}
		else
		{
			lookupName = name.toLowerCase();
			res = this.data.find(item => item.name.toLowerCase() == lookupName);
		}

		return copyObject(res);
	}


	isHidden(item)
	{
		if (!item)
			throw new Error('Invalid person');

		return (item.flags & PERSON_HIDDEN) == PERSON_HIDDEN;
	}


	getVisible(returnRaw = false)
	{
		let res = this.data.filter(item => !this.isHidden(item));

		if (returnRaw)
			return copyObject(res);
		else
			return new PersonsList(res);
	}


	getHidden(returnRaw = false)
	{
		let res = this.data.filter(item => this.isHidden(item));

		if (returnRaw)
			return copyObject(res);
		else
			return new PersonsList(res);
	}
}
