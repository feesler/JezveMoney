// Log in page class
function LoginPage()
{
	LoginPage.parent.constructor.apply(this, arguments);
}


extend(LoginPage, TestPage);


LoginPage.prototype.parseContent = function()
{
	var res = { loginInp : vge('login'),
 				passwordInp : vge('password'),
				submitBtn : vquery('.login_controls .btn.ok_btn'),
				registerLink : vquery('.login_controls .alter_link > a') };
	if (!res.loginInp || !res.passwordInp || !res.submitBtn || !res.registerLink)
		throw new Error('Wrong login page structure');

	return res;
};


LoginPage.prototype.loginAs = function(login, password)
{
	inputEmul(this.content.loginInp, login);
	inputEmul(this.content.passwordInp, password);

	return navigation(() => clickEmul(this.content.submitBtn), MainPage);
};
