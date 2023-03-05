<div id="listCurrForm" class="request-data-form">
    <h3>Get currencies</h3>
    <form action="<?= BASEURL ?>api/currency/list" method="get">
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="readCurrForm" class="request-data-form">
    <h3>Read currency</h3>
    <div class="std_margin">
        <label for="read_curr_id">Id</label>
        <input id="read_curr_id" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="readcurrbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>

<div id="createCurrForm" class="request-data-form">
    <h3>Create currency</h3>
    <form action="<?= BASEURL ?>api/currency/create" method="post">
        <div class="std_margin">
            <label for="create_currency_name">Name</label>
            <input id="create_currency_name" class="stretch-input" name="name" type="text">
        </div>
        <div class="std_margin">
            <label for="create_currency_sign">Sign</label>
            <input id="create_currency_sign" class="stretch-input" name="sign" type="text">
        </div>
        <div class="std_margin">
            <label for="create_currency_flags">Flags (0 - sign on right, 1 - sign on left)</label>
            <input id="create_currency_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="updateCurrForm" class="request-data-form">
    <h3>Update currency</h3>
    <form action="<?= BASEURL ?>api/currency/update" method="post">
        <div class="std_margin">
            <label for="update_currency_id">Id</label>
            <input id="update_currency_id" class="stretch-input" name="id" type="text">
        </div>
        <div class="std_margin">
            <label for="update_currency_name">Name</label>
            <input id="update_currency_name" class="stretch-input" name="name" type="text">
        </div>
        <div class="std_margin">
            <label for="update_currency_sign">Sign</label>
            <input id="update_currency_sign" class="stretch-input" name="sign" type="text">
        </div>
        <div class="std_margin">
            <label for="update_currency_flags">Flags (0 - sign on right, 1 - sign on left)</label>
            <input id="update_currency_flags" class="stretch-input" name="flags" type="text">
        </div>
        <div class="form-controls">
            <input class="btn submit-btn" type="submit" value="Submit">
        </div>
    </form>
</div>

<div id="delCurrForm" class="request-data-form">
    <h3>Delete currency</h3>
    <div class="std_margin">
        <label for="delcurrencies">Currencies (comma separated ids)</label>
        <input id="delcurrencies" class="stretch-input" type="text">
    </div>
    <div class="form-controls">
        <input id="delcurrbtn" class="btn submit-btn" type="button" value="Submit">
    </div>
</div>