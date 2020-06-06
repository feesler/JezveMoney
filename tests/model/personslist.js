import { List } from "./list.js";
import { api } from './api.js';
import { copyObject } from "../common.js";


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
}
