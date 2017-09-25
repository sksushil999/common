export class ServerPageInput {
    offset = 0;
    pageNo = 1;
    pageSize = 10;
    limit = 10;
    noPaging = true;
    query = {};
    serverPaging: boolean = true;
}
