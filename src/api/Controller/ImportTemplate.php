<?php

namespace JezveMoney\App\API\Controller;

use JezveMoney\Core\ApiListController;
use JezveMoney\Core\Message;
use JezveMoney\App\Model\ImportTemplateModel;
use JezveMoney\App\Item\ImportTemplateItem;

class ImportTemplate extends ApiListController
{
    protected $requiredFields = [
        "name",
        "type_id",
        "account_id",
        "first_row",
        "date_col",
        "comment_col",
        "trans_curr_col",
        "trans_amount_col",
        "account_curr_col",
        "account_amount_col",
    ];


    public function initAPI()
    {
        parent::initAPI();

        $this->model = ImportTemplateModel::getInstance();
        $this->createErrorMsg = __("ERR_IMPTPL_CREATE");
        $this->updateErrorMsg = __("ERR_IMPTPL_UPDATE");
        $this->deleteErrorMsg = __("ERR_IMPTPL_DELETE");
    }


    protected function prepareItem($item)
    {
        return new ImportTemplateItem($item);
    }


    protected function prepareListRequest($request)
    {
        return [];
    }
}
