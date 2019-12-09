
if (typeof module !== 'undefined' && module.exports)
{
	var LoginView = require('../view/login.js');
	var MainView = require('../view/main.js');
}


var runProfile = (function()
{
	let App = null;
	let test = null;
	let env = null;


	function onAppUpdate(props)
	{
		props = props || {};

		if ('App' in props)
		{
			App = props.App;
			test = App.test;
		}
	}


	async function reloginAs(view, userObj)
	{
		env = view.props.environment;

		if (!userObj || !userObj.login || !userObj.password)
			throw new Error('Wrong user object');

		if (view.isUserLoggedIn())
		{
			view = await view.logoutUser();
		}

		if (!(view instanceof LoginView))
			throw new Error('Wrong page');

		view = await view.loginAs(userObj.login, userObj.password);
		await test('Test user login', () => (view instanceof MainView), env);

		return view;
	}


	return { onAppUpdate : onAppUpdate,
				relogin : reloginAs };
})();


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = runProfile;
}
