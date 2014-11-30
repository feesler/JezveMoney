<?php	include("./view/templates/commonhdr.tpl");	?>
</head>
<body>
<?php	require_once("./view/templates/header.tpl");		?>
<form action="./modules/user.php?act=login" method="post" onsubmit="return onLoginSubmit(this);">
<div class="layer login_layer">
	<div class="cont">
		<div class="box">
			<h1>Log in</h1>
			<label for="login">Username</label>
			<div class="stretch_input std_input"><div><input id="login" name="login" type="text"></div></div>
			<label for="password">Password</label>
			<div class="stretch_input std_input"><div><input id="password" name="password" type="password"></div></div>
			<div class="login_controls"><input class="btn ok_btn" type="submit" value="Log in"><span class="alter_link"><a href="./register.php">Register</a></span></div>
		</div>
	</div>
</div>
</form>
</body>
</html>
