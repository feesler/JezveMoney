<?php	include("./view/templates/commonhdr.tpl");	?>
</head>
<body>
<div class="page">
	<div class="page_wrapper">
<?php	include("./view/templates/header.tpl");	?>

		<div class="container">
			<div class="content">
				<div class="content_wrap admin_cont_wrap">
					<h2>API test</h2>

					<div>
						<h2>Accounts</h2>

						<div class="test_container">
						Get accounts
						<form action="../api/account.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Read account
						<form action="../api/account.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<label for="accid">Id</label>
							<input name="accid" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Create account
						<form action="../api/account.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<label for="accname">Name</label>
							<input name="accname" type="text"><br>
							<label for="balance">Balance</label>
							<input name="balance" type="text"><br>
							<label for="currency">Currency (1-5, 10-22)</label>
							<input name="currency" type="text"><br>
							<label for="icon">Icon (1-6; 0 - no icon)</label>
							<input name="icon" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Edit account
						<form action="../api/account.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<label for="accid">Id</label>
							<input name="accid" type="text"><br>
							<label for="accname">Name</label>
							<input name="accname" type="text"><br>
							<label for="balance">Balance</label>
							<input name="balance" type="text"><br>
							<label for="currency">Currency (1-5, 10-22)</label>
							<input name="currency" type="text"><br>
							<label for="icon">Icon (1-6; 0 - no icon)</label>
							<input name="icon" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Delete account
						<form action="../api/account.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
							<label for="accounts">Accounts (comma separated ids)</label>
							<input name="accounts" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Reset accounts
						<form action="../api/account.php?act=reset" method="post" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>Transactions</h2>

						<div class="test_container">
						Get transactions
						<form action="../api/transaction.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<input type="checkbox" onchange="onCheck(this, 'count');"><label for="count">Max. count</label>
							<input name="count" type="text" value="10" disabled><br>
							<input type="checkbox" onchange="onCheck(this, 'page');"><label for="page">Page number</label>
							<input name="page" type="text" value="0" disabled><br>
							<input type="checkbox" onchange="onCheck(this, 'acc_id');"><label for="acc_id">Account id (0 for all accounts)</label>
							<input name="acc_id" type="text" value="0" disabled><br>
							<input type="checkbox" onchange="onCheck(this, 'stdate');"><label for="stdate">Start date</label>
							<input name="stdate" type="text" value="" disabled><br>
							<input type="checkbox" onchange="onCheck(this, 'enddate');"><label for="enddate">End date</label>
							<input name="enddate" type="text" value="" disabled><br>
							<input type="checkbox" onchange="onCheck(this, 'search');"><label for="search">Search request</label>
							<input name="search" type="text" value="" disabled><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Read transaction
						<form action="../api/transaction.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<label for="transid">Id</label>
							<input name="transid" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Create transaction
						<form action="../api/transaction.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<label for="transtype">Type (1-3)</label>
							<input name="transtype" type="text"><br>

							<label for="src_id">Source account</label>
							<input name="src_id" type="text"><br>
							<label for="dest_id">Destination account</label>
							<input name="dest_id" type="text"><br>

							<label for="src_amount">Source amount</label>
							<input name="src_amount" type="text"><br>
							<label for="dest_amount">Destination amount</label>
							<input name="dest_amount" type="text"><br>

							<label for="src_curr">Source currency</label>
							<input name="src_curr" type="text"><br>
							<label for="dest_curr">Destination currency</label>
							<input name="dest_curr" type="text"><br>

							<label for="date">Date</label>
							<input name="date" type="text"><br>

							<label for="comm">Comment</label>
							<input name="comm" type="text"><br>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Create debt
						<form action="../api/transaction.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<input name="transtype" type="hidden" value="4">
							<label for="person_id">Person id</label>
							<input name="person_id" type="text"><br>
							<label for="acc_id">Account id</label>
							<input name="acc_id" type="text"><br>
							<label for="debtop">Debt operation (1 or 2)</label>
							<input name="debtop" type="text"><br>

							<label for="src_amount">Source amount</label>
							<input name="src_amount" type="text"><br>
							<label for="dest_amount">Destination amount</label>
							<input name="dest_amount" type="text"><br>

							<label for="src_curr">Source currency</label>
							<input name="src_curr" type="text"><br>
							<label for="dest_curr">Destination currency</label>
							<input name="dest_curr" type="text"><br>

							<label for="date">Date</label>
							<input name="date" type="text"><br>

							<label for="comm">Comment</label>
							<input name="comm" type="text"><br>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Edit transaction
						<form action="../api/transaction.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<label for="transid">Transaction id</label>
							<input name="transid" type="text"><br>

							<label for="transtype">Type (1-3)</label>
							<input name="transtype" type="text"><br>

							<label for="src_id">Source account</label>
							<input name="src_id" type="text"><br>
							<label for="dest_id">Destination account</label>
							<input name="dest_id" type="text"><br>

							<label for="src_amount">Source amount</label>
							<input name="src_amount" type="text"><br>
							<label for="dest_amount">Destination amount</label>
							<input name="dest_amount" type="text"><br>

							<label for="src_curr">Source currency</label>
							<input name="src_curr" type="text"><br>
							<label for="dest_curr">Destination currency</label>
							<input name="dest_curr" type="text"><br>

							<label for="date">Date</label>
							<input name="date" type="text"><br>

							<label for="comm">Comment</label>
							<input name="comm" type="text"><br>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>


						<div class="test_container">
						Edit debt
						<form action="../api/transaction.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<label for="transid">Transaction id</label>
							<input name="transid" type="text"><br>

							<input name="transtype" type="hidden" value="4">

							<label for="person_id">Person id</label>
							<input name="person_id" type="text"><br>
							<label for="acc_id">Account id</label>
							<input name="acc_id" type="text"><br>
							<label for="debtop">Debt operation (1 or 2)</label>
							<input name="debtop" type="text"><br>

							<label for="src_amount">Source amount</label>
							<input name="src_amount" type="text"><br>
							<label for="dest_amount">Destination amount</label>
							<input name="dest_amount" type="text"><br>

							<label for="src_curr">Source currency</label>
							<input name="src_curr" type="text"><br>
							<label for="dest_curr">Destination currency</label>
							<input name="dest_curr" type="text"><br>

							<label for="date">Date</label>
							<input name="date" type="text"><br>

							<label for="comm">Comment</label>
							<input name="comm" type="text"><br>

							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Delete transactions
						<form action="../api/transaction.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
							<label for="transactions">Transactions (comma separated ids)</label>
							<input name="transactions" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>


						<div class="test_container">
						Set position of transacction
						<form action="../api/transaction.php?act=setpos" method="post" onsubmit="return onFormSubmit(this);">
							<label for="id">Id</label>
							<input name="id" type="text"><br>
							<label for="pos">Position</label>
							<input name="pos" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>Persons</h2>

						<div class="test_container">
						Get persons
						<form action="../api/person.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Read person
						<form action="../api/person.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<label for="pid">Id</label>
							<input name="pid" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Create person
						<form action="../api/person.php?act=new" method="post" onsubmit="return onFormSubmit(this);">
							<label for="pname">Name</label>
							<input name="pname" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Edit person
						<form action="../api/person.php?act=edit" method="post" onsubmit="return onFormSubmit(this);">
							<label for="pid">Id</label>
							<input name="pid" type="text"><br>
							<label for="pname">Name</label>
							<input name="pname" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Delete persons
						<form action="../api/person.php?act=del" method="post" onsubmit="return onFormSubmit(this);">
							<label for="persons">Persons (comma separated ids)</label>
							<input name="persons" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>Currency</h2>

						<div class="test_container">
						Get currencies
						<form action="../api/currency.php?act=list" method="get" onsubmit="return onFormSubmit(this);">
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<div class="test_container">
						Read currency
						<form action="../api/currency.php?act=read" method="post" onsubmit="return onFormSubmit(this);">
							<label for="curr_id">Id</label>
							<input name="curr_id" type="text"><br>
							<div class="acc_controls">
								<input class="adm_act_btn" type="submit" value="submit">
							</div>
						</form>
						</div>

						<h2>User</h2>
						<div class="test_container">
						Register
						<form action="../api/register.php" method="post" onsubmit="return onFormSubmit(this);">
							<label for="login">Login</label>
							<input name="login" type="text"><br>
							<label for="password">Password</label>
							<input name="password" type="text"><br>
							<label for="name">Name</label>
							<input name="name" type="text"><br>
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
