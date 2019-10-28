// Log in page class
function LoginPage()
{
	LoginPage.parent.constructor.apply(this, arguments);
}


extend(LoginPage, TestPage);


LoginPage.prototype.parseContent = async function()
{
	var res = { loginInp : await vquery('#login'),
 				passwordInp : await vquery('#password'),
				submitBtn : await vquery('.login_controls .btn.ok_btn'),
				registerLink : await vquery('.login_controls .alter_link > a') };
	if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
		throw new Error('Wrong login page structure');

	return res;
};


LoginPage.prototype.loginAs = async function(login, password)
{
	await inputEmul(this.content.loginInp, login);
 	await inputEmul(this.content.passwordInp, password);
	return this.navigation(() => clickEmul(this.content.submitBtn), MainPage);
};
