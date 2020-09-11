<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<?php	require_once(TPL_PATH."header.tpl");		?>
<form id="regfrm" action="<?=BASEURL?>register/" method="post">
<div class="layer register_layer">
	<div class="cont">
		<div class="box">
			<h1>Registration</h1>
			<div id="login-inp-block" class="validation-block std_margin">
				<label for="login">Account name</label>
				<div class="stretch_input"><input id="login" name="login" type="text"></div>
				<div class="invalid-feedback">Please input your login.</div>
			</div>
			<div id="name-inp-block" class="validation-block std_margin">
				<label for="login">Name</label>
				<div class="stretch_input"><input id="name" name="name" type="text"></div>
				<div class="invalid-feedback">Please input you name.</div>
			</div>
			<div id="pwd-inp-block" class="validation-block std_margin">
				<label for="password">Password</label>
				<div class="stretch_input"><input id="password" name="password" type="password"></div>
				<div class="invalid-feedback">Please input correct password.</div>
			</div>
			<div class="login_controls"><input class="btn ok_btn" type="submit" value="ok"><span class="alter_link"><a href="<?=BASEURL?>login/">Log in</a></span></div>
		</div>
	</div>
</div>
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>onReady(initRegisterPage)</script>
</body>
</html>
