import { TransactionsView } from '../../view/transactions.js';


var runTransactionsCommon = (function()
{
	let test = null;


	async function iterateTransactionPages(app)
	{
		let res = { items : [], pages : [] };

		if (!(app.view instanceof TransactionsView) || !app.view.content.transList)
			throw new Error('Not expected view');

		if (!app.view.isFirstPage())
			await app.view.goToFirstPage();

		while(app.view.content.transList.items.length)
		{
			let pageItems = app.view.content.transList.items.map(item => {
				return {
					id : item.id,
					accountTitle : item.accountTitle,
					amountText : item.amountText,
					dateFmt : item.dateFmt,
					comment : item.comment
				}
			});

			res.pages.push(pageItems);
			res.items.push(...pageItems);

			if (app.view.isLastPage())
				break;

			await app.view.goToNextPage();
		}

		return res;
	}


	async function deleteTransactions(app, type, transactions)
	{
		test = app.test;

		app.view.setBlock('Delete transactions [' + transactions.join() + ']', 3);

		await app.goToMainView();

		// Save accounts and persons before delete transactions
		app.beforeDeleteTransaction = {};

		app.beforeDeleteTransaction.accounts = app.copyObject(await app.view.global('accounts'));
		app.beforeDeleteTransaction.persons = app.copyObject(await app.view.global('persons'));

		// Navigate to transactions view and filter by specified type of transaction
		await app.view.goToTransactions();
		await app.view.filterByType(type);

		let transListBefore = await iterateTransactionPages(app);

		let trCount = transListBefore.items.length;
		app.beforeDeleteTransaction.trCount = trCount;

		app.beforeDeleteTransaction.deleteList = [];
		for(let trPos of transactions)
		{
			if (trPos < 0 || trPos >= trCount)
				throw new Error('Wrong transaction position: ' + trPos);

			let trObj = transListBefore.items[trPos];
			if (!trObj)
				throw new Error('Transaction not found');

			app.beforeDeleteTransaction.deleteList.push(trObj);
		}


		// Request view to select and delete transactions and wait for navigation
		await app.view.deleteTransactions(transactions);
		await app.view.filterByType(type);

		let transListAfter = await iterateTransactionPages(app);

		// Check count of transactions
		await test('Transactions list update', async () =>
		{
			if (transListBefore.items.length - transactions.length != transListAfter.items.length)
				throw new Error('Unexpected count of transactions');

			for(let trItem of app.beforeDeleteTransaction.deleteList)
			{
				if (transListAfter.items.find(item => item.id == trItem.id))
					throw new Error('Transaction ' + trItem.id + ' not deleted');
			}

			return true;
		}, app.view.props.environment);

		app.transactions = transListAfter.items;


		// Navigate to main view and check changes in affected accounts and persons
		await app.goToMainView();

		let origAccounts = app.beforeDeleteTransaction.accounts;
		let origPersons = app.beforeDeleteTransaction.persons;

		// Widget changes
		var personsWidget = { infoTiles : { items : { length : app.persons.length } } };
		var accWidget = { tiles : { items : { length : app.accounts.length } } };

		let affectedAccounts = [];
		let affectedPersons = [];

		for(let tr of app.beforeDeleteTransaction.deleteList)
		{
			if (tr.type == app.EXPENSE)
			{
				let srcAccPos = app.getPosById(origAccounts, tr.src_id);
				if (srcAccPos === -1)
					throw new Error('Account ' + tr.src_id + ' not found');

				if (!(srcAccPos in affectedAccounts))
				{
					let acc = origAccounts[srcAccPos];

					affectedAccounts[srcAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				affectedAccounts[srcAccPos].balance += tr.src_amount;
			}
			else if (tr.type == app.INCOME)
			{
				let destAccPos = app.getPosById(origAccounts, tr.dest_id);
				if (destAccPos === -1)
					throw new Error('Account ' + tr.dest_id + ' not found');

				if (!(destAccPos in affectedAccounts))
				{
					let acc = origAccounts[destAccPos];

					affectedAccounts[destAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				affectedAccounts[destAccPos].balance -= tr.dest_amount;
			}
			else if (tr.type == app.TRANSFER)
			{
				let srcAccPos = app.getPosById(origAccounts, tr.src_id);
				if (srcAccPos === -1)
					throw new Error('Account ' + tr.src_id + ' not found');

				if (!(srcAccPos in affectedAccounts))
				{
					let acc = origAccounts[srcAccPos];

					affectedAccounts[srcAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				let destAccPos = app.getPosById(origAccounts, tr.dest_id);
				if (destAccPos === -1)
					throw new Error('Account ' + tr.dest_id + ' not found');

				if (!(destAccPos in affectedAccounts))
				{
					let acc = origAccounts[destAccPos];

					affectedAccounts[destAccPos] = { balance : acc.balance,
													name : acc.name,
													curr_id : acc.curr_id };
				}

				affectedAccounts[srcAccPos].balance += tr.src_amount;
				affectedAccounts[destAccPos].balance -= tr.dest_amount;
			}
			else if (tr.type == app.DEBT)
			{
				let personAcc_id = (tr.debtType == 1) ? tr.src_id : tr.dest_id;
				let person = app.getPersonByAcc(origPersons, personAcc_id);
				if (!person)
					throw new Error('Not found person with account ' + personAcc_id);

				if (!person.accounts)
					person.accounts = [];

				let personPos = app.getPosById(origPersons, person.id);

				if (!(personPos in affectedPersons))
				{
					affectedPersons[personPos] = { name : person.name,
													accounts : app.copyObject(person.accounts) };
				}

				let personAcc = affectedPersons[personPos].accounts.find(a => a.id == personAcc_id);
				if (!personAcc)
					throw new Error('Not found account of person');

				personAcc.balance += (tr.debtType == 1) ? tr.src_amount : -tr.dest_amount;

				let acc_id = (tr.debtType == 1) ? tr.dest_id : tr.src_id;
				if (acc_id)
				{
					let accPos = app.getPosById(origAccounts, acc_id);
					if (accPos === -1)
						throw new Error('Account ' + acc_id + ' not found');

					if (!(accPos in affectedAccounts))
					{
						let acc = origAccounts[accPos];

						affectedAccounts[accPos] = { balance : acc.balance,
														name : acc.name,
														curr_id : acc.curr_id };
					}

					affectedAccounts[accPos].balance += (tr.debtType == 1) ? -tr.dest_amount : tr.src_amount;
				}
			}
		}


		for(let accPos in affectedAccounts)
		{
			let acc = affectedAccounts[accPos];
			let fmtBal = app.formatCurrency(acc.balance, acc.curr_id, app.currencies);

			accWidget.tiles.items[accPos] = { balance : fmtBal, name : acc.name };
		}

		for(let personPos in affectedPersons)
		{
			let person = affectedPersons[personPos];

			let debtAccounts = person.accounts.reduce((val, pacc) =>
			{
				if (pacc.balance == 0)
					return val;

				let fmtBal = app.formatCurrency(pacc.balance, pacc.curr_id, app.currencies);
				return val.concat(fmtBal);
			}, []);

			let debtSubtitle = debtAccounts.length ? debtAccounts.join('\n') : 'No debts';

			personsWidget.infoTiles.items[personPos] = { title : person.name, subtitle : debtSubtitle };
		}

		let state = { values : { widgets : { length : 5, 0 : accWidget, 3 : personsWidget } } };

		await test('Acounts and persons update', async () => {}, app.view, state);

		app.transactions = app.view.content.widgets[2].transList.items;
		app.accounts = app.view.content.widgets[0].tiles.items;
		app.persons = app.view.content.widgets[3].infoTiles.items;
	}


 	return { del : deleteTransactions };
})();


export { runTransactionsCommon };

