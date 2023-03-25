<div id="loginForm" class="request-data-form">
    <h3>Login</h3>
    <form action="<?= BASEURL ?>api/login/" method="post">
        <div class="std_margin">
            <label for="login_login">Login</label>
            <input id="login_login" class="input stretch-input" name="login" type="text"><br>
        </div>
        <div class="std_margin">
            <label for="login_password">Password</label>
            <input id="login_password" class="input stretch-input" name="password" type="text"><br>
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="logoutForm" class="request-data-form">
    <h3>Login</h3>
    <form action="<?= BASEURL ?>api/logout/" method="post">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="registerForm" class="request-data-form">
    <h3>Register</h3>
    <form action="<?= BASEURL ?>api/register/" method="post">
        <div class="std_margin">
            <label for="reg_login">Login</label>
            <input id="reg_login" class="input stretch-input" name="login" type="text">
        </div>
        <div class="std_margin">
            <label for="reg_password">Password</label>
            <input id="reg_password" class="input stretch-input" name="password" type="text">
        </div>
        <div class="std_margin">
            <label for="reg_name">Name</label>
            <input id="reg_name" class="input stretch-input" name="name" type="text">
        </div>

        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>