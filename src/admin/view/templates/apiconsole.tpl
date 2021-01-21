<?php	include(ADMIN_TPL_PATH."commonhdr.tpl");	?>
</head>
<body>
<div class="page">
    <div class="page_wrapper">
<?php	include(ADMIN_TPL_PATH."header.tpl");	?>

        <div class="container">
            <div class="content">
                <div class="content_wrap admin_cont_wrap">
                    <div class="heading">
                        <h1>API test</h1>
                    </div>

<div class="api-console">
    <div class="left-column">
        <ul id="controllersList" class="menu-list">
            <li>
                <button>Common</button>
                <ul class="sub-menu-list">
                    <li data-target="readStateForm">Read state</li>
                </ul>
            </li>

            <li class="active">
                <button>Accounts</button>
                <ul class="sub-menu-list">
                    <li data-target="listAccForm" class="active">List</li>
                    <li data-target="readAccForm">Read</li>
                    <li data-target="createAccForm">Create</li>
                    <li data-target="updateAccForm">Update</li>
                    <li data-target="delAccForm">Delete</li>
                    <li data-target="resetAccForm">Reset</li>
                </ul>
            </li>

            <li>
                <button>Transactions</button>
                <ul class="sub-menu-list">
                    <li data-target="listTrForm">List</li>
                    <li data-target="readTrForm">Read</li>
                    <li data-target="createTrForm">Create</li>
                    <li data-target="createDebtForm">Create debt</li>
                    <li data-target="updateTrForm">Update</li>
                    <li data-target="updateDebtForm">Update debt</li>
                    <li data-target="delTrForm">Delete</li>
                    <li data-target="setTrPosForm">Set position</li>
                </ul>
            </li>

            <li>
                <button>Import templates</button>
                <ul class="sub-menu-list">
                    <li data-target="listTplForm">List</li>
                    <li data-target="readTplForm">Read</li>
                    <li data-target="createTplForm">Create</li>
                    <li data-target="updateTplForm">Update</li>
                    <li data-target="delTplForm">Delete</li>
                </ul>
            </li>

            <li>
                <button>Persons</button>
                <ul class="sub-menu-list">
                    <li data-target="listPersonsForm">List</li>
                    <li data-target="readPersonForm">Read</li>
                    <li data-target="createPersonForm">Create</li>
                    <li data-target="updatePersonForm">Update</li>
                    <li data-target="delPersonForm">Delete</li>
                </ul>
            </li>

            <li>
                <button>Currency</button>
                <ul class="sub-menu-list">
                    <li data-target="listCurrForm">List</li>
                    <li data-target="readCurrForm">Read</li>
                    <li data-target="createCurrForm">Create</li>
                    <li data-target="updateCurrForm">Update</li>
                    <li data-target="delCurrForm">Delete</li>
                </ul>
            </li>

            <li>
                <button>Icon</button>
                <ul class="sub-menu-list">
                    <li data-target="listIconForm">List</li>
                    <li data-target="readIconForm">Read</li>
                    <li data-target="createIconForm">Create</li>
                    <li data-target="updateIconForm">Update</li>
                    <li data-target="delIconForm">Delete</li>
                </ul>
            </li>

            <li>
                <button>User</button>
                <ul class="sub-menu-list">
                    <li data-target="loginForm">Login</li>
                    <li data-target="logoutForm">Logout</li>
                    <li data-target="registerForm">Register</li>
                </ul>
            </li>

            <li>
                <button>Profile</button>
                <ul class="sub-menu-list">
                    <li data-target="readProfileForm">Read profile</li>
                    <li data-target="changeNameForm">Change name</li>
                    <li data-target="changePwdForm">Change password</li>
                    <li data-target="resetAllForm">Reset all data</li>
                </ul>
            </li>
        </ul>
    </div>

    <div class="center-column">
        <div id="readStateForm" class="request-data-form">
        <h3>Read state</h3>
        <form action="<?=BASEURL?>api/state" method="list">
            <div class="acc_controls">
                <input id="readstatebtn" class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="listAccForm" class="request-data-form active">
        <h3>List accounts</h3>
        <form action="<?=BASEURL?>api/account/list" method="list">
            <div class="std_margin">
                <input name="full" type="checkbox" value="1"><label for="count">Include accounts of persons</label>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="type"><label for="count">Type</label>
                <select name="type" disabled>
                    <option value="all">All</option>
                    <option value="visible" selected>Visible</option>
                    <option value="hidden">Hidden</option>
                </select>
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readAccForm" class="request-data-form">
        <h3>Read accounts by ids</h3>
        <div class="std_margin"><label for="readaccid">Id</label><input id="readaccid" type="text"></div>
        <div class="acc_controls">
            <input id="readaccbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="createAccForm" class="request-data-form">
        <h3>Create account</h3>
        <form action="<?=BASEURL?>api/account/create" method="post">
            <div class="std_margin">
                <label for="create_account_name">Name</label>
                <input id="create_account_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="create_account_initbalance">Initial balance</label>
                <input id="create_account_initbalance" name="initbalance" type="text">
            </div>
            <div class="std_margin">
                <label for="create_account_curr">Currency (1-5, 10-22)</label>
                <input id="create_account_curr" name="curr_id" type="text">
            </div>
            <div class="std_margin">
                <label for="create_account_icon">Icon (1-6; 0 - no icon)</label>
                <input id="create_account_icon" name="icon_id" type="text">
            </div>
            <div class="std_margin">
                <label for="create_account_flags">Flags (0 - account is visible; 1 - hidden)</label>
                <input id="create_account_flags" name="flags" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="updateAccForm" class="request-data-form">
        <h3>Update account</h3>
        <form action="<?=BASEURL?>api/account/update" method="post">
            <div class="std_margin">
                <label for="update_account_id">Id</label>
                <input id="update_account_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_account_name">Name</label>
                <input id="update_account_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="update_account_initbalance">Initial balance</label>
                <input id="update_account_initbalance" name="initbalance" type="text">
            </div>
            <div class="std_margin">
                <label for="update_account_curr">Currency (1-5, 10-22)</label>
                <input id="update_account_curr" name="curr_id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_account_icon">Icon (1-6; 0 - no icon)</label>
                <input id="update_account_icon" name="icon_id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_account_flags">Flags (0 - account is visible; 1 - hidden)</label>
                <input id="update_account_flags" name="flags" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="delAccForm" class="request-data-form">
        <h3>Delete accounts</h3>
        <div class="std_margin">
            <label for="delaccounts">Accounts (comma separated ids)</label>
            <input id="delaccounts" type="text">
        </div>
        <div class="acc_controls">
            <input id="delaccbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="resetAccForm" class="request-data-form">
        <h3>Reset accounts</h3>
        <form action="<?=BASEURL?>api/account/reset" method="post">
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="listTrForm" class="request-data-form">
        <h3>List</h3>
        <form action="<?=BASEURL?>api/transaction/list" method="list">
            <div class="std_margin">
                <input type="checkbox" data-target="order"><label>Order</label>
                <div id="admin_block" class="checkbox-wrap checkbox-wrap_inline">
                    <label for="list_trans_isasc"><input id="list_trans_isasc" name="order" type="radio" value="asc" checked disabled>Ascending</label>
                </div>
                <div id="admin_block" class="checkbox-wrap checkbox-wrap_inline">
                    <label for="list_trans_isdesc"><input id="list_trans_isdesc" name="order" type="radio" value="desc" disabled>Descending</label>
                </div>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="type"><label for="list_trans_type">Types</label>
                <input id="list_trans_type" name="type" type="text" value="0" disabled>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="count"><label for="list_trans_count">Max. count</label>
                <input id="list_trans_count" name="count" type="text" value="10" disabled>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="page"><label for="list_trans_page">Page number</label>
                <input id="list_trans_page" name="page" type="text" value="0" disabled>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="acc_id"><label for="list_trans_accounts">Account ids</label>
                <input id="list_trans_accounts" name="acc_id" type="text" value="0" disabled>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="stdate"><label for="list_trans_stdate">Start date</label>
                <input id="list_trans_stdate" name="stdate" type="text" value="" disabled>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="enddate"><label for="list_trans_enddate">End date</label>
                <input id="list_trans_enddate" name="enddate" type="text" value="" disabled>
            </div>
            <div class="std_margin">
                <input type="checkbox" data-target="search"><label for="list_trans_search">Search request</label>
                <input id="list_trans_search" name="search" type="text" value="" disabled>
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readTrForm" class="request-data-form">
        <h3>Read by ids</h3>
        <div class="std_margin">
            <label for="read_trans_id">Id</label>
            <input id="read_trans_id" type="text">
        </div>
        <div class="acc_controls">
            <input id="readtransbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="createTrForm" class="request-data-form">
        <h3>Create</h3>
        <form action="<?=BASEURL?>api/transaction/create" method="post">
            <div class="std_margin">
                <label for="create_trans_type">Type (1-3)</label>
                <input id="create_trans_type" name="type" type="text">
            </div>
            <div class="std_margin">
                <label for="create_trans_src_id">Source account</label>
                <input id="create_trans_src_id" name="src_id" type="text">
            </div>
            <div class="std_margin">
                <label for="create_trans_dest_id">Destination account</label>
                <input id="create_trans_dest_id" name="dest_id" type="text">
            </div>
            <div class="std_margin">
                <label for="create_trans_src_amount">Source amount</label>
                <input id="create_trans_src_amount" name="src_amount" type="text">
            </div>
            <div class="std_margin">
                <label for="create_trans_dest_amount">Destination amount</label>
                <input id="create_trans_dest_amount" name="dest_amount" type="text">
            </div>

            <div class="std_margin">
                <label for="create_trans_src_curr">Source currency</label>
                <input id="create_trans_src_curr" name="src_curr" type="text">
            </div>
            <div class="std_margin">
                <label for="create_trans_dest_curr">Destination currency</label>
                <input id="create_trans_dest_curr" name="dest_curr" type="text">
            </div>

            <div class="std_margin">
                <label for="create_trans_date">Date</label>
                <input id="create_trans_date" name="date" type="text">
            </div>

            <div class="std_margin">
                <label for="create_trans_comment">Comment</label>
                <input id="create_trans_comment" name="comment" type="text">
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="createDebtForm" class="request-data-form">
        <h3>Create debt</h3>
        <form action="<?=BASEURL?>api/transaction/create" method="post">
            <input name="type" type="hidden" value="4">
            <div class="std_margin">
                <label for="create_debt_person_id">Person id</label>
                <input id="create_debt_person_id" name="person_id" type="text">
            </div>
            <div class="std_margin">
                <label for="create_debt_acc_id">Account id</label>
                <input id="create_debt_acc_id" name="acc_id" type="text">
            </div>
            <div class="std_margin">
                <label for="create_debt_op">Debt operation (1 or 2)</label>
                <input id="create_debt_op" name="op" type="text">
            </div>

            <div class="std_margin">
                <label for="create_debt_src_amount">Source amount</label>
                <input id="create_debt_src_amount" name="src_amount" type="text">
            </div>
            <div class="std_margin">
                <label for="create_debt_dest_amount">Destination amount</label>
                <input id="create_debt_dest_amount" name="dest_amount" type="text">
            </div>

            <div class="std_margin">
                <label for="create_debt_src_curr">Source currency</label>
                <input id="create_debt_src_curr" name="src_curr" type="text">
            </div>
            <div class="std_margin">
                <label for="create_debt_dest_curr">Destination currency</label>
                <input id="create_debt_dest_curr" name="dest_curr" type="text">
            </div>

            <div class="std_margin">
                <label for="create_debt_date">Date</label>
                <input id="create_debt_date" name="date" type="text">
            </div>

            <div class="std_margin">
                <label for="create_debt_comment">Comment</label>
                <input id="create_debt_comment" name="comment" type="text">
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="updateTrForm" class="request-data-form">
        <h3>Update</h3>
        <form action="<?=BASEURL?>api/transaction/update" method="post">
            <div class="std_margin">
                <label for="update_trans_id">Transaction id</label>
                <input id="update_trans_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_trans_type">Type (1-3)</label>
                <input id="update_trans_type" name="type" type="text">
            </div>

            <div class="std_margin">
                <label for="update_trans_src_id">Source account</label>
                <input id="update_trans_src_id" name="src_id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_trans_dest_id">Destination account</label>
                <input id="update_trans_dest_id" name="dest_id" type="text">
            </div>

            <div class="std_margin">
                <label for="update_trans_src_amount">Source amount</label>
                <input id="update_trans_src_amount" name="src_amount" type="text">
            </div>
            <div class="std_margin">
                <label for="update_trans_dest_amount">Destination amount</label>
                <input id="update_trans_dest_amount" name="dest_amount" type="text">
            </div>

            <div class="std_margin">
                <label for="update_trans_src_curr">Source currency</label>
                <input id="update_trans_src_curr" name="src_curr" type="text">
            </div>
            <div class="std_margin">
                <label for="update_trans_dest_curr">Destination currency</label>
                <input id="update_trans_dest_curr" name="dest_curr" type="text">
            </div>

            <div class="std_margin">
                <label for="update_trans_date">Date</label>
                <input id="update_trans_date" name="date" type="text">
            </div>

            <div class="std_margin">
                <label for="update_trans_comment">Comment</label>
                <input id="update_trans_comment" name="comment" type="text">
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>


        <div id="updateDebtForm" class="request-data-form">
        <h3>Update debt</h3>
        <form action="<?=BASEURL?>api/transaction/update" method="post">
            <input name="type" type="hidden" value="4">
            <div class="std_margin">
                <label for="update_debt_id">Transaction id</label>
                <input id="update_debt_id" name="id" type="text">
            </div>

            <div class="std_margin">
                <label for="update_debt_person_id">Person id</label>
                <input id="update_debt_person_id" name="person_id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_debt_acc_id">Account id</label>
                <input id="update_debt_acc_id" name="acc_id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_debt_op">Debt operation (1 or 2)</label>
                <input id="update_debt_op" name="op" type="text">
            </div>

            <div class="std_margin">
                <label for="update_debt_src_amount">Source amount</label>
                <input id="update_debt_src_amount" name="src_amount" type="text">
            </div>
            <div class="std_margin">
                <label for="update_debt_dest_amount">Destination amount</label>
                <input id="update_debt_dest_amount" name="dest_amount" type="text">
            </div>

            <div class="std_margin">
                <label for="update_debt_src_curr">Source currency</label>
                <input id="update_debt_src_curr" name="src_curr" type="text">
            </div>
            <div class="std_margin">
                <label for="update_debt_dest_curr">Destination currency</label>
                <input id="update_debt_dest_curr" name="dest_curr" type="text">
            </div>

            <div class="std_margin">
                <label for="update_debt_date">Date</label>
                <input id="update_debt_date" name="date" type="text">
            </div>

            <div class="std_margin">
                <label for="update_debt_comment">Comment</label>
                <input id="update_debt_comment" name="comment" type="text">
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="delTrForm" class="request-data-form">
        <h3>Delete transactions</h3>
        <div class="std_margin">
            <label for="deltransactions">Transactions (comma separated ids)</label>
            <input id="deltransactions" type="text">
        </div>

        <div class="acc_controls">
            <input id="deltransbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="setTrPosForm" class="request-data-form">
        <h3>Set position of transacction</h3>
        <form action="<?=BASEURL?>api/transaction/setpos" method="post">
            <div class="std_margin">
                <label for="trans_pos_id">Id</label>
                <input id="trans_pos_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="trans_pos_pos">Position</label>
                <input id="trans_pos_pos" name="pos" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="listTplForm" class="request-data-form">
        <h3>List import templates</h3>
        <form action="<?=BASEURL?>api/importtpl/list" method="list">
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readTplForm" class="request-data-form">
        <h3>Read templates by ids</h3>
        <div class="std_margin"><label for="readtplid">Id</label><input id="readtplid" type="text"></div>
        <div class="acc_controls">
            <input id="readtplbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="createTplForm" class="request-data-form">
        <h3>Create import template</h3>
        <form action="<?=BASEURL?>api/importtpl/create" method="post">
            <div class="std_margin">
                <label for="create_tpl_name">Name</label>
                <input id="create_tpl_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="create_tpl_type">Type</label>
                <input id="create_tpl_type" name="type_id" type="text">
            </div>
            <label>Columns (1-based)</label>
<?php   foreach($tplColumns as $column) { ?>
            <div class="std_margin">
                <label for="create_tpl_<?=e($column["name"])?>"><?=e($column["title"])?></label>
                <input id="create_tpl_<?=e($column["name"])?>" name="<?=e($column["name"])?>" type="text">
            </div>
<?php   }   ?>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="updateTplForm" class="request-data-form">
        <h3>Update import template</h3>
        <form action="<?=BASEURL?>api/importtpl/update" method="post">
            <div class="std_margin">
                <label for="update_tpl_id">Id</label>
                <input id="update_tpl_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_tpl_name">Name</label>
                <input id="update_tpl_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="update_tpl_type">Type</label>
                <input id="update_tpl_type" name="type_id" type="text">
            </div>
<?php   foreach($tplColumns as $column) { ?>
            <div class="std_margin">
                <label for="update_tpl_<?=e($column["name"])?>"><?=e($column["title"])?></label>
                <input id="update_tpl_<?=e($column["name"])?>" name="<?=e($column["name"])?>" type="text">
            </div>
<?php   }   ?>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="delTplForm" class="request-data-form">
        <h3>Delete import templates</h3>
        <div class="std_margin">
            <label for="deltemplates">Templates (comma separated ids)</label>
            <input id="deltemplates" type="text">
        </div>
        <div class="acc_controls">
            <input id="deltplbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="listPersonsForm" class="request-data-form">
        <h3>List persons</h3>
        <form action="<?=BASEURL?>api/person/list" method="list">
            <div class="std_margin">
                <input type="checkbox" data-target="type"><label for="count">Type</label>
                <select name="type" disabled>
                    <option value="all">All</option>
                    <option value="visible" selected>Visible</option>
                    <option value="hidden">Hidden</option>
                </select>
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readPersonForm" class="request-data-form">
        <h3>Read person</h3>
        <div class="std_margin">
            <label for="read_person_id">Id</label>
            <input id="read_person_id" type="text">
        </div>
        <div class="acc_controls">
            <input id="readpersonbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="createPersonForm" class="request-data-form">
        <h3>Create person</h3>
        <form action="<?=BASEURL?>api/person/create" method="post">
            <div class="std_margin">
                <label for="create_person_name">Name</label>
                <input id="create_person_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="create_person_flags">Flags (0 - person is visible; 1 - hidden)</label>
                <input id="create_person_flags" name="flags" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="updatePersonForm" class="request-data-form">
        <h3>Update person</h3>
        <form action="<?=BASEURL?>api/person/update" method="post">
            <div class="std_margin">
                <label for="update_person_id">Id</label>
                <input id="update_person_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_person_name">Name</label>
                <input id="update_person_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="update_person_flags">Flags (0 - person is visible; 1 - hidden)</label>
                <input id="update_person_flags" name="flags" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="delPersonForm" class="request-data-form">
        <h3>Delete persons</h3>
        <div class="std_margin">
            <label for="delpersons">Persons (comma separated ids)</label>
            <input id="delpersons" type="text">
        </div>
        <div class="acc_controls">
            <input id="delpersonbtn" class="adm_act_btn" type="submit" value="submit">
        </div>
        </div>

        <div id="listCurrForm" class="request-data-form">
        <h3>Get currencies</h3>
        <form action="<?=BASEURL?>api/currency/list" method="list">
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readCurrForm" class="request-data-form">
        <h3>Read currency</h3>
        <div class="std_margin">
            <label for="read_curr_id">Id</label>
            <input id="read_curr_id" type="text">
        </div>
        <div class="acc_controls">
            <input id="readcurrbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="createCurrForm" class="request-data-form">
        <h3>Create currency</h3>
        <form action="<?=BASEURL?>api/currency/create" method="post">
            <div class="std_margin">
                <label for="create_currency_name">Name</label>
                <input id="create_currency_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="create_currency_sign">Sign</label>
                <input id="create_currency_sign" name="sign" type="text">
            </div>
            <div class="std_margin">
                <label for="create_currency_flags">Flags (0 - sign on right, 1 - sign on left)</label>
                <input id="create_currency_flags" name="flags" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="updateCurrForm" class="request-data-form">
        <h3>Update currency</h3>
        <form action="<?=BASEURL?>api/currency/update" method="post">
            <div class="std_margin">
                <label for="update_currency_id">Id</label>
                <input id="update_currency_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_currency_name">Name</label>
                <input id="update_currency_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="update_currency_sign">Sign</label>
                <input id="update_currency_sign" name="sign" type="text">
            </div>
            <div class="std_margin">
                <label for="update_currency_flags">Flags (0 - sign on right, 1 - sign on left)</label>
                <input id="update_currency_flags" name="flags" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="delCurrForm" class="request-data-form">
        <h3>Delete currency</h3>
        <div class="std_margin">
            <label for="delcurrencies">Currencies (comma separated ids)</label>
            <input id="delcurrencies" type="text">
        </div>
        <div class="acc_controls">
            <input id="delcurrbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="listIconForm" class="request-data-form">
        <h3>Get icons</h3>
        <form action="<?=BASEURL?>api/icon/list" method="list">
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readIconForm" class="request-data-form">
        <h3>Read icon</h3>
        <div class="std_margin">
            <label for="read_icon_id">Id</label>
            <input id="read_icon_id" type="text">
        </div>
        <div class="acc_controls">
            <input id="read_icon_btn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="createIconForm" class="request-data-form">
        <h3>Create icon</h3>
        <form action="<?=BASEURL?>api/icon/create" method="post">
            <div class="std_margin">
                <label for="create_icon_name">Name</label>
                <input id="create_icon_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="create_icon_file">File name</label>
                <input id="create_icon_file" name="file" type="text">
            </div>
            <div class="std_margin">
                <label for="create_icon_type">Type (0 - No type, 1 - Tile icon)</label>
                <input id="create_icon_type" name="type" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="updateIconForm" class="request-data-form">
        <h3>Update icon</h3>
        <form action="<?=BASEURL?>api/icon/update" method="post">
            <div class="std_margin">
                <label for="update_icon_id">Id</label>
                <input id="update_icon_id" name="id" type="text">
            </div>
            <div class="std_margin">
                <label for="update_icon_name">Name</label>
                <input id="update_icon_name" name="name" type="text">
            </div>
            <div class="std_margin">
                <label for="update_icon_file">File name</label>
                <input id="update_icon_file" name="file" type="text">
            </div>
            <div class="std_margin">
                <label for="update_icon_type">Type (0 - No type, 1 - Tile icon)</label>
                <input id="update_icon_type" name="type" type="text">
            </div>
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="delIconForm" class="request-data-form">
        <h3>Delete icons</h3>
        <div class="std_margin">
            <label for="del_icons">Icons (comma separated ids)</label>
            <input id="del_icons" type="text">
        </div>
        <div class="acc_controls">
            <input id="deliconbtn" class="adm_act_btn" type="button" value="submit">
        </div>
        </div>

        <div id="loginForm" class="request-data-form">
        <h3>Login</h3>
        <form action="<?=BASEURL?>api/login/" method="post">
            <div class="std_margin">
                <label for="login_login">Login</label>
                <input id="login_login" name="login" type="text"><br>
            </div>
            <div class="std_margin">
                <label for="login_password">Password</label>
                <input id="login_password" name="password" type="text"><br>
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="logoutForm" class="request-data-form">
            <h3>Login</h3>
            <form action="<?=BASEURL?>api/logout/" method="post">
                <div class="acc_controls">
                    <input class="adm_act_btn" type="submit" value="submit">
                </div>
            </form>
        </div>

        <div id="registerForm" class="request-data-form">
        <h3>Register</h3>
        <form action="<?=BASEURL?>api/register/" method="post">
            <div class="std_margin">
                <label for="reg_login">Login</label>
                <input id="reg_login" name="login" type="text"><br>
            </div>
            <div class="std_margin">
                <label for="reg_password">Password</label>
                <input id="reg_password" name="password" type="text"><br>
            </div>
            <div class="std_margin">
                <label for="reg_name">Name</label>
                <input id="reg_name" name="name" type="text">
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="readProfileForm" class="request-data-form">
        <h3>Read profile</h3>
        <form action="<?=BASEURL?>api/profile/read" method="list">
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="changeNameForm" class="request-data-form">
        <h3>Change name</h3>
        <form action="<?=BASEURL?>api/profile/changename" method="post">
            <div class="std_margin">
                <label for="change_name">Name</label>
                <input id="change_name" name="name" type="text"><br>
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="changePwdForm" class="request-data-form">
        <h3>Change password</h3>
        <form action="<?=BASEURL?>api/profile/changepass" method="post">
            <div class="std_margin">
                <label for="change_pass_current">Current password</label>
                <input id="change_pass_current" name="current" type="text"><br>
            </div>
            <div class="std_margin">
                <label for="change_pass_new">New password</label>
                <input id="change_pass_new" name="new" type="text"><br>
            </div>

            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>

        <div id="resetAllForm" class="request-data-form">
        <h3>Reset all data</h3>
        <form action="<?=BASEURL?>api/profile/reset" method="post">
            <div class="acc_controls">
                <input class="adm_act_btn" type="submit" value="submit">
            </div>
        </form>
        </div>
    </div>

    <div class="right-column">
        <div class="request-log">
            <h2>Request log</h2><input id="clearResultsBtn" class="adm_act_btn" type="button" value="clear" disabled>
        </div>
        <div id="results"></div>
    </div>

</div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php	include(ADMIN_TPL_PATH."footer.tpl");	?>
<script>
var view = new AdminApiConsoleView();
</script>
</body>
</html>
