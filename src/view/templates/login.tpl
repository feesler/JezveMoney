<?php	include("./view/templates/commonhdr.tpl");	?>
<?php	Message::check();		?>
<script>onReady(initLoginPage)</script>
</head>
<body>
<form id="loginfrm" action="<?=BASEURL?>login/" method="post">
<div class="layer login_layer">
	<div class="cont">
		<div class="box">
			<div class="left_side">
				<div class="u_cont">
					<div class="login_logo"><span class="logo"></span><span class="title">Jezve Money</span></div>
				</div>
			</div>
			<div class="side_sep"></div>
			<div class="right_side">
				<div>
					<h1>Log in</h1>
					<label for="login">Username</label>
					<div class="stretch_input std_input"><input id="login" name="login" type="text"></div>
					<label for="password">Password</label>
					<div class="stretch_input std_input"><input id="password" name="password" type="password"></div>
					<div class="login_controls"><input class="btn ok_btn" type="submit" value="Log in"><span class="alter_link"><a href="<?=BASEURL?>register/">Register</a></span></div>
				</div>
			</div>
		</div>
	</div>
</div>
</form>
</body>
</html>
