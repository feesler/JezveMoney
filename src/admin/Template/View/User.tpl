<?php	include(ADMIN_TPL_PATH . "Header.tpl");	?>

<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH . "Component/tpl/Header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <h2>Users</h2>

                    <table class="admin-tbl">
                        <thead>
                            <tr><th>id</th><th>login</th><th>name</th><th>access</th><th>accounts</th><th>transactions</th><th>persons</th></tr>
                        </thead>
                        <tbody id="items-list">
<?php	foreach($itemsData as $userInfo) {		?>
                            <tr data-id=<?=e($userInfo->id)?>>
                                <td><?=e($userInfo->id)?></td>
                                <td><?=e($userInfo->login)?></td>
                                <td><?=e($userInfo->name)?></td>
                                <td><?=e($userInfo->accessTitle)?></td>
                                <td><?=e($userInfo->accCount)?></td>
                                <td><?=e($userInfo->trCount)?></td>
                                <td><?=e($userInfo->pCount)?></td>
                            </tr>
<?php	}	?>
                        </tbody>
                    </table>

                    <div class="form-controls">
                        <input id="createbtn" class="adm_act_btn" type="button" value="create">
                        <input id="updbtn" class="adm_act_btn" type="button" value="update" hidden>
                        <input id="passbtn" class="adm_act_btn" type="button" value="set password" hidden>
                        <input id="del_btn" class="adm_act_btn" type="button" value="delete" hidden>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<form id="item-frm" method="post" hidden>
    <input id="user_id" name="id" type="hidden">
    <div id="login_block" class="view-row">
        <label for="user_login">Login</label>
        <input id="user_login" class="stretch-input" name="login" type="text">
    </div>
    <div id="name_block" class="view-row">
        <label for="user_name">Name</label>
        <input id="user_name" class="stretch-input" name="name" type="text">
    </div>
    <div id="pwd_block" class="view-row">
        <label for="user_pass">Password</label>
        <input id="user_pass" class="stretch-input" name="password" type="password">
    </div>
    <div id="admin_block" class="view-row">
        <div class="checkbox-wrap">
            <label for="isadmin"><input id="isadmin" name="access" type="radio" value="1">Admin access level</label>
        </div>
        <div class="checkbox-wrap">
            <label for="istester"><input id="istester" name="access" type="radio" value="2">Tester access level</label>
        </div>
        <div class="checkbox-wrap">
            <label for="isdefault"><input id="isdefault" name="access" type="radio" value="0">Default access level</label>
        </div>
    </div>
    <div class="popup__form-controls">
        <input class="btn submit-btn" type="submit" value="Submit">
    </div>
</form>

<?php	include(ADMIN_TPL_PATH . "Footer.tpl");	?>
