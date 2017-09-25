import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams, ResponseContentType } from '@angular/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { IApi, ServerDataModel, ServerPageInput, ServerPageModel } from './contracts/api';
import { ILocalStore } from './contracts/local-store-interface';
import * as _ from 'lodash';
import { ToastyService, ToastyConfig } from 'ng2-toasty';
import { IGetParams } from './contracts/api/get-params.interface';
import { environment } from '../../environments/environment';

export class GenericApi<TModel> implements IApi<TModel> {

  private rootUrl: string;

  private getHeaders(): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    let externalToken = window.localStorage.getItem('external-token');
    let amsToken = window.localStorage.getItem('ams_token');
    let orgCode = window.localStorage.getItem('orgCode');

    if (this.apiName === 'ams') {
      if (amsToken)
        headers.append('x-access-token', amsToken);
      if (externalToken)
        headers.append('external-token', externalToken)
      // else if (emsToken)
      //   headers.append('external-token', emsToken);

    } else if (this.apiName === 'ems') {
      // if (externalToken)
      //   headers.append('external-token', externalToken)
      if (externalToken)
        headers.append('x-access-token', externalToken);
    }


    headers.append('org-code', orgCode);

    return headers;
  }

  private handleError(error: any): Promise<any> {
    // console.log('error', error)
    if (error.status === 0) {

      return Promise.reject('There is no internet connection')
    };
    if (error.status) {
      if (error.status === 401) {
        window.onbeforeunload = function () {
          console.log("blank function do nothing")
        }
        return;
        // return Promise.reject('Your are logged Out');
      }
      return Promise.reject(error.statusText);
    }
    return Promise.reject(error.message || error);
  }

  private getQueryParams(input: ServerPageInput): URLSearchParams {

    let params: URLSearchParams = new URLSearchParams();
    _.each(input, (value, key, obj) => {
      if (key === "query") {
        _.each(value, (keyVal, keyKey) => {
          if (keyVal)
            params.set(keyKey, keyVal);
        })
      } else {
        params.set(key, value);
      }
    });
    return params
  }

  get(id: number | string): Promise<TModel> {
    return this.http.get(`${this.rootUrl}/${this.key}/${id}`, { headers: this.getHeaders() })
      .toPromise()
      .then((response) => {
        const dataModel = response.json() as ServerDataModel<TModel>;

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel.data;
      })
      .catch(this.handleError);
  }

  simpleGet(input?: IGetParams): Promise<TModel> {

    let url: string = `${this.rootUrl}/${this.key}`;
    let parms: URLSearchParams = null;

    if (input) {
      parms = input.serverPageInput ? this.getQueryParams(input.serverPageInput) : null;
      url = input.id ? `${url}/${input.id}` : url;
      url = input.path ? `${url}/${input.path}` : url;
    }

    return this.http.get(url, { headers: this.getHeaders(), search: parms })
      .toPromise()
      .then((response) => {
        const dataModel = response.json() as ServerDataModel<TModel>;

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel.data || dataModel.items;
      })
      .catch(this.handleError);
  }



  search(input: ServerPageInput): Promise<ServerPageModel<TModel>> {
    let parms: URLSearchParams = this.getQueryParams(input);
    return this.http.get(`${this.rootUrl}/${this.key}`, { headers: this.getHeaders(), search: parms })
      .toPromise()
      .then((response) => {
        const dataModel = response.json() as ServerPageModel<TModel>;

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel;
      })
      .catch(this.handleError);
  }

  create(model: TModel, path?: string): Promise<TModel> {

    let url: string = `${this.rootUrl}/${this.key}`;
    url = path ? `${url}/${path}` : url;

    return this.http.post(url, model, { headers: this.getHeaders() })
      .toPromise()
      .then((response) => {
        const dataModel = response.json() as ServerDataModel<TModel>;

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel.data;
      })
      .catch(this.handleError);
  }

  exportReport(input: ServerPageInput, path?: string, reportName?: string): Promise<any> {
    let parms: URLSearchParams = this.getQueryParams(input);
    let apiPath: string = path ? `${this.rootUrl}/${path}` : `${this.rootUrl}/${this.key}`;

    return this.http.get(apiPath, { headers: this.getHeaders(), search: parms, responseType: ResponseContentType.Blob }).toPromise()
      .then((resposne) => {

        let contentType = resposne.headers.get("content-type") || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        // get the headers' content disposition
        let cd = resposne.headers.get("content-disposition") || resposne.headers.get("Content-Disposition");

        // get the file name with regex
        let regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        let match = regex.exec(cd);

        // is there a fiel name?
        let fileName = match && match[1] || "report";
        if (reportName)
          fileName = reportName;

        // replace leading and trailing slashes that C# added to your file name
        fileName = fileName.replace(/\"/g, "");

        let blob = new Blob([resposne['_body']], { type: contentType });
        if (navigator.msSaveBlob) {
          navigator.msSaveBlob(blob, fileName);
        } else {
          let objectUrl = window.URL.createObjectURL(blob);
          // window.open(objectUrl);
          let a = document.createElement("a");
          a.href = objectUrl;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(objectUrl);
          document.body.appendChild(a);
          document.body.removeChild(a);
        }


      })
      .catch(this.handleError);
  }

  simpePost(model: any): Promise<any> {
    return this.http.post(`${this.rootUrl}/${this.key}`, model, { headers: this.getHeaders() })
      .toPromise()
      .then((response) => {
        const dataModel = response.json();

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel.data;
      })
      .catch(this.handleError);
  }

  update(id: number | string, model: TModel, input?: ServerPageInput, path?: string): Promise<TModel> {
    let parms: URLSearchParams;
    if (input) {
      parms = this.getQueryParams(input);
    }
    let url = path ? `${this.rootUrl}/${this.key}/${path}` : `${this.rootUrl}/${this.key}/${id}`;
    return this.http.put(url, model, { headers: this.getHeaders(), search: parms })
      .toPromise()
      .then((response) => {
        const dataModel = response.json() as ServerDataModel<TModel>;

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel.data;
      })
      .catch(this.handleError);
  }

  remove(id: number): Promise<void> {
    return this.http.delete(`${this.rootUrl}/${this.key}/${id}`, { headers: this.getHeaders() })
      .toPromise()
      .then((response) => {
        const dataModel = response.json() as ServerDataModel<TModel>;

        if (!dataModel.isSuccess) {
          if (response.status === 200) {
            return this.handleError(dataModel.message || dataModel.error || dataModel.code || 'failed');
          } else {
            return this.handleError(response.status);
          }
        }
        return dataModel.data;
      })
      .catch(this.handleError);
  }


  constructor(
    private key: string,
    private http: Http,
    private apiName: 'ems' | 'ams', // ems or ams
    private token?: string) {
    this.rootUrl = `${environment.apiUrls[apiName]}/api` || `${apiName}/api`;
  }
}
