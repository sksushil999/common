import { IRemoteData } from './remote-data.interface';

export class ServerPageModel<TModel> implements IRemoteData {
    isSuccess: boolean;
    code: string;
    error: string;
    message: string;
    pageNo: number;
    pageSize: number;
    total: number;
    totalPage: number;
    totalRecords: number;
    data: Array<TModel>;
    items: Array<TModel>;
    stats: any;
}
