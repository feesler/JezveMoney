import { isFunction } from './common.js'


export class Runner
{
	constructor()
	{
		this.tasks = [];
	}


	addTask(action, data)
	{
		if (!isFunction(action))
			throw new Error('Invalid action specified');

		this.tasks.push({ action, data });
	}


	addTasks(tasks)
	{
		if (!Array.isArray(tasks))
			throw new Error('Invalid tasks specified. Array is expected');
		
		tasks.forEach(item => this.addTask(item.action, item.data));
	}


	async run()
	{
		let results = [];
		for(let task of this.tasks)
		{
			let result = await task.action(task.data);
			results.push(result);
		}
		this.tasks = [];

		return results;
	}


	// Run list of tasks
	// Task object : { action, data }
	async runTasks(tasks)
	{
		this.addTasks(tasks);
		return this.run();
	}


	addGroup(action, groupData)
	{
		if (!Array.isArray(groupData))
			throw new Error('Invalid group data specified. Array is expected.');

		groupData.forEach(data => this.addTask(action, data));
	}


	// Run array of data for single action
	async runGroup(action, groupData)
	{
		this.addGroup(action, groupData);
		return this.run();
	}
}