<?php	include(TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<?php	require_once(TPL_PATH."header.tpl");		?>
<form id="regfrm" action="<?=BASEURL?>register/" method="post">
<div class="layer register_layer">
	<div class="cont">
		<div class="box">
			<h1>Registration</h1>
			<label for="login">Account name</label>
			<div class="stretch_input std_input"><input id="login" name="login" type="text"></div>
			<label for="login">Name</label>
			<div class="stretch_input std_input"><input id="name" name="name" type="text"></div>
			<label for="password">Password</label>
			<div class="stretch_input std_input"><input id="password" name="password" type="password"></div>
			<div class="login_controls"><input class="btn ok_btn" type="submit" value="ok"><span class="alter_link"><a href="<?=BASEURL?>login/">Log in</a></span></div>
		</div>
	</div>
</div>
</form>

<?php	include(TPL_PATH."footer.tpl");	?>
<script>onReady(initRegisterPage)</script>
</body>
</html>
