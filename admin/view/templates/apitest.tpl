<?php	include("./view/templates/commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h1>API test</h1>

					<div>
						<h2>Accounts</h2>

						<div class="test_container">
						<h3>Get accounts</h3>
						<form action="../api/account.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Read account</h3>
						<form action="../api/account.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin"><label for="accid">Id</label><input name="accid" type="text"></div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Create account</h3>
						<form action="../api/account.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="accname">Name</label>
								<input name="accname" type="text">
							</div>
							<div class="std_margin">
								<label for="balance">Balance</label>
								<input name="balance" type="text">
							</div>
							<div class="std_margin">
								<label for="currency">Currency (1-5, 10-22)</label>
								<input name="currency" type="text">
							</div>
							<div class="std_margin">
								<label for="icon">Icon (1-6; 0 - no icon)</label>
								<input name="icon" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Edit account</h3>
						<form action="../api/account.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="accid">Id</label>
								<input name="accid" type="text">
							</div>
							<div class="std_margin">
								<label for="accname">Name</label>
								<input name="accname" type="text">
							</div>
							<div class="std_margin">
								<label for="balance">Balance</label>
								<input name="balance" type="text">
							</div>
							<div class="std_margin">
								<label for="currency">Currency (1-5, 10-22)</label>
								<input name="currency" type="text">
							</div>
							<div class="std_margin">
								<label for="icon">Icon (1-6; 0 - no icon)</label>
								<input name="icon" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Delete account</h3>
						<form action="../api/account.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="accounts">Accounts (comma separated ids)</label>
								<input name="accounts" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Reset accounts
						<form action="../api/account.php?act=reset" method="post" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>Transactions</h2>

						<div class="test_container">
						<h3>Get transactions</h3>
						<form action="../api/transaction.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'count');"><label for="count">Max. count</label>
								<input name="count" type="text" value="10" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'page');"><label for="page">Page number</label>
								<input name="page" type="text" value="0" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'acc_id');"><label for="acc_id">Account id (0 for all accounts)</label>
								<input name="acc_id" type="text" value="0" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'stdate');"><label for="stdate">Start date</label>
								<input name="stdate" type="text" value="" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'enddate');"><label for="enddate">End date</label>
								<input name="enddate" type="text" value="" disabled>
							</div>
							<div class="std_margin">
								<input type="checkbox" onchange="onCheck(this, 'search');"><label for="search">Search request</label>
								<input name="search" type="text" value="" disabled>
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Read transaction</h3>
						<form action="../api/transaction.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="transid">Id</label>
								<input name="transid" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Create transaction</h3>
						<form action="../api/transaction.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="transtype">Type (1-3)</label>
								<input name="transtype" type="text">
							</div>
							<div class="std_margin">
								<label for="src_id">Source account</label>
								<input name="src_id" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_id">Destination account</label>
								<input name="dest_id" type="text">
							</div>
							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Create debt</h3>
						<form action="../api/transaction.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<input name="transtype" type="hidden" value="4">
							<div class="std_margin">
								<label for="person_id">Person id</label>
								<input name="person_id" type="text">
							</div>
							<div class="std_margin">
								<label for="acc_id">Account id</label>
								<input name="acc_id" type="text">
							</div>
							<div class="std_margin">
								<label for="debtop">Debt operation (1 or 2)</label>
								<input name="debtop" type="text">
							</div>

							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Edit transaction</h3>
						<form action="../api/transaction.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="transid">Transaction id</label>
								<input name="transid" type="text">
							</div>
							<div class="std_margin">
								<label for="transtype">Type (1-3)</label>
								<input name="transtype" type="text">
							</div>

							<div class="std_margin">
								<label for="src_id">Source account</label>
								<input name="src_id" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_id">Destination account</label>
								<input name="dest_id" type="text">
							</div>

							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>


						<div class="test_container">
						<h3>Edit debt</h3>
						<form action="../api/transaction.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<input name="transtype" type="hidden" value="4">
							<div class="std_margin">
								<label for="transid">Transaction id</label>
								<input name="transid" type="text">
							</div>

							<div class="std_margin">
								<label for="person_id">Person id</label>
								<input name="person_id" type="text">
							</div>
							<div class="std_margin">
								<label for="acc_id">Account id</label>
								<input name="acc_id" type="text">
							</div>
							<div class="std_margin">
								<label for="debtop">Debt operation (1 or 2)</label>
								<input name="debtop" type="text">
							</div>

							<div class="std_margin">
								<label for="src_amount">Source amount</label>
								<input name="src_amount" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_amount">Destination amount</label>
								<input name="dest_amount" type="text">
							</div>

							<div class="std_margin">
								<label for="src_curr">Source currency</label>
								<input name="src_curr" type="text">
							</div>
							<div class="std_margin">
								<label for="dest_curr">Destination currency</label>
								<input name="dest_curr" type="text">
							</div>

							<div class="std_margin">
								<label for="date">Date</label>
								<input name="date" type="text">
							</div>

							<div class="std_margin">
								<label for="comm">Comment</label>
								<input name="comm" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Delete transactions</h3>
						<form action="../api/transaction.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="transactions">Transactions (comma separated ids)</label>
								<input name="transactions" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>


						<div class="test_container">
						<h3>Set position of transacction</h3>
						<form action="../api/transaction.php?act=setpos" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="id">Id</label>
								<input name="id" type="text">
							</div>
							<div class="std_margin">
								<label for="pos">Position</label>
								<input name="pos" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>Persons</h2>

						<div class="test_container">
						<h3>Get persons</h3>
						<form action="../api/person.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Read person</h3>
						<form action="../api/person.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="pid">Id</label>
								<input name="pid" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Create person</h3>
						<form action="../api/person.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="pname">Name</label>
								<input name="pname" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Edit person</h3>
						<form action="../api/person.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="pid">Id</label>
								<input name="pid" type="text">
							</div>
							<div class="std_margin">
								<label for="pname">Name</label>
								<input name="pname" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Delete persons</h3>
						<form action="../api/person.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="persons">Persons (comma separated ids)</label>
								<input name="persons" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>Currency</h2>

						<div class="test_container">
						<h3>Get currencies</h3>
						<form action="../api/currency.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						<h3>Read currency</h3>
						<form action="../api/currency.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="curr_id">Id</label>
								<input name="curr_id" type="text">
							</div>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>User</h2>
						<div class="test_container">
						<h3>Register</h3>
						<form action="../api/register.php" method="post" onsubmit="return onFormSubmit(this);">
							<div class="std_margin">
								<label for="login">Login</label>
								<input name="login" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="password">Password</label>
								<input name="password" type="text"><br>
							</div>
							<div class="std_margin">
								<label for="name">Name</label>
								<input name="name" type="text">
							</div>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div id="results" class="test_result">
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</body>
</html>
