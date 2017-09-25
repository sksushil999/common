import { ServerPageInput } from './page-input';
import { ServerDataModel } from './server-data-model';
import { ServerPageModel } from './server-page-model';
import { Observable } from 'rxjs/Rx';
import { IGetParams } from './get-params.interface';

export interface IApi<TModel> {
  get(id: number | string): Promise<TModel>;
  simpleGet(input?: IGetParams): Promise<any>;
  search(input: ServerPageInput): Promise<ServerPageModel<TModel>>;
  create(model: TModel, path?: string): Promise<TModel>;
  update(id: number | string, model: TModel, input?: ServerPageInput, path?: string): Promise<TModel>;
  remove(id: number): Promise<void>;
  simpePost(model: any): Promise<void>;
  exportReport(input: ServerPageInput, path?: string, reportName?: string): Promise<void>;
}
