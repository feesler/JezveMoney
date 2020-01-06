import { TransactionsView } from '../../view/transactions.js';
import { MainView } from '../../view/main.js';
import { TransactionsList } from '../../trlist.js';
import { api } from '../../api.js';


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

		let pos = app.view.pagesCount() * app.config.transactionsOnPage;
		while(app.view.content.transList.items.length)
		{
			let pageItems = app.view.content.transList.items.map(item => {
				return {
					id : item.id,
					accountTitle : item.accountTitle,
					amountText : item.amountText,
					dateFmt : item.dateFmt,
					comment : item.comment,
					pos : pos--
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


	// Check transactions data from API is the same as show on the transactions list page
	// Return instance of TransactionsList with current data
	async function checkTransactionsDataConsistency(app, descr, transList)
	{
		let env = app.environment;
		let test = app.test;

		// Save all transactions
		if (!(app.view instanceof MainView))
			await app.goToMainView();
		await app.view.goToTransactions();
		let transListBefore = await iterateTransactionPages(app);

		let expListItems = await app.state.renderTransactionsList(transList.list);

		await test(descr, () => app.checkObjValue(transListBefore.items, expListItems), env);
	}


	async function deleteTransactions(app, type, transactions)
	{
		test = app.test;

		app.view.setBlock('Delete transactions [' + transactions.join() + ']', 3);

		await app.goToMainView();

		// Save accounts and persons before delete transactions
		let accList = await app.state.getAccountsList();
		let pList = await app.state.getPersonsList();
		let trBefore = await api.transaction.list();
		let expTransList = new TransactionsList(app, trBefore);

		// Navigate to transactions view and filter by specified type of transaction
		await app.view.goToTransactions();
		await app.view.filterByType(type);
		// Request view to select and delete transactions
		await app.view.deleteTransactions(transactions);

		app.state.accounts = null;
		app.state.persons = null;

		await app.goToMainView();

		// Prepare expected transaction list
		let removedTrans = expTransList.del(type, transactions);

		for(let tr of removedTrans)
		{
			let afterDelete = app.state.deleteTransaction(accList, tr);
			accList = afterDelete;
		}

		let expectedState = await app.state.render(accList, pList, expTransList.list);

		await test('Main page widgets update', async () => {}, app.view, expectedState);

		app.accountTiles = app.view.content.widgets[app.config.AccountsWidgetPos].tiles.items;
		app.personTiles = app.view.content.widgets[app.config.PersonsWidgetPos].infoTiles.items;

		await checkTransactionsDataConsistency(app, 'List of transactions update', expTransList);

		app.transactions = expTransList.list;
	}


 	return { iteratePages : iterateTransactionPages,
				checkData : checkTransactionsDataConsistency,
				del : deleteTransactions };
})();


export { runTransactionsCommon };

