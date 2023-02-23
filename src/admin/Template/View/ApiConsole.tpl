<?php include(ADMIN_TPL_PATH . "Header.tpl");    ?>

<div class="page">
    <div class="page_wrapper">
        <?php include(ADMIN_TPL_PATH . "Component/tpl/Header.tpl");    ?>
        <div id="apiMenu" class="navigation navigation_closed">
            <nav class="navigation-content">
                <div class="navigation-controls">
                    <button class="navigation__close-btn"><?= svgIcon("back", "navigation__close-btn-icon") ?></button>
                    <div class="navigation-logo">
                        <div class="header-logo">
                            <span class="header-logo__title">API Methods</span>
                        </div>
                    </div>
                </div>

                <ul id="controllersList" class="menu-list">
                    <li>
                        <button>Common</button>
                        <ul class="sub-menu-list">
                            <li data-target="readStateForm">Read state</li>
                            <li data-target="mainStateForm">Main state</li>
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
                            <li data-target="setAccPosForm">Set position</li>
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
                            <li data-target="setPersonPosForm">Set position</li>
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
                            <li data-target="setTrCategoryForm">Set category</li>
                            <li data-target="setTrPosForm">Set position</li>
                            <li data-target="statisticsForm">Statistics</li>
                        </ul>
                    </li>

                    <li>
                        <button>Categories</button>
                        <ul class="sub-menu-list">
                            <li data-target="listCategoriesForm">List</li>
                            <li data-target="readCategoryForm">Read</li>
                            <li data-target="createCategoryForm">Create</li>
                            <li data-target="updateCategoryForm">Update</li>
                            <li data-target="delCategoryForm">Delete</li>
                            <li data-target="setCategoryPosForm">Set position</li>
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
                        <button>Import rules</button>
                        <ul class="sub-menu-list">
                            <li data-target="listRuleForm">List</li>
                            <li data-target="readRuleForm">Read</li>
                            <li data-target="createRuleForm">Create</li>
                            <li data-target="updateRuleForm">Update</li>
                            <li data-target="delRuleForm">Delete</li>
                        </ul>
                    </li>

                    <li>
                        <button>Import conditions</button>
                        <ul class="sub-menu-list">
                            <li data-target="listCondForm">List</li>
                            <li data-target="readCondForm">Read</li>
                            <li data-target="createCondForm">Create</li>
                            <li data-target="updateCondForm">Update</li>
                            <li data-target="delCondForm">Delete</li>
                        </ul>
                    </li>

                    <li>
                        <button>Import actions</button>
                        <ul class="sub-menu-list">
                            <li data-target="listActForm">List</li>
                            <li data-target="readActForm">Read</li>
                            <li data-target="createActForm">Create</li>
                            <li data-target="updateActForm">Update</li>
                            <li data-target="delActForm">Delete</li>
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
                            <li data-target="updateSettingsForm">Update settings</li>
                            <li data-target="resetForm">Reset data</li>
                        </ul>
                    </li>
                </ul>
            </nav>
            <div class="navigation-bg"></div>
        </div>

        <div class="container">
            <div class="content">
                <div class="content_wrap">
                    <div class="heading">
                        <h1>API console</h1>
                    </div>

                    <button id="toggleMethodsBtn" class="btn methods-toggle-btn">Methods</button>

                    <div class="api-console">
                        <div class="center-column">

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Common.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Accounts.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Persons.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Transactions.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Categories.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/ImportTemplates.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/ImportRules.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/ImportConditions.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/ImportActions.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Currencies.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Icons.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/User.tpl");    ?>

                            <?php include(ADMIN_TPL_PATH . "Component/tpl/ApiConsole/Profile.tpl");    ?>

                        </div>

                        <div class="right-column">
                            <div class="request-log">
                                <h2>Request log</h2><input id="clearResultsBtn" class="btn submit-btn" type="button" value="clear" disabled>
                            </div>
                            <div id="results"></div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include(ADMIN_TPL_PATH . "Footer.tpl");    ?>