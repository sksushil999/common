import { IApi, ServerPageInput } from './api';
import { Filters } from './filters';
import * as _ from 'lodash';
import { Location } from '@angular/common';

export class PageOptions<TModel> {
  api: IApi<TModel>;
  properties?: TModel;
  fields?: {
    id: 'id',
    timeStamp: 'timeStamp'
  };
  formatter?: (model: TModel) => TModel;
  pageSize?= 10;
  serverPaging?= true;
  currentPage?= 1;
  total?= 0;
  totalPage?= 0;
  items?: TModel[];
  filters?: any[];
  location?: Location;
}

export class PageModel<TModel> {
  pageNo = 1;
  pageSize: number;
  total = 0;
  totalPage = 0;
  totalRecords = 0;
  items: Array<TModel>;
  stats: any;
}
export interface IPage {
  fetch(callback?: (err: any, page?: IPage) => any): any;
  // autoComplete(callback?: (err: any, page?: IPage) => any): any;
}

export class Page<TModel> extends PageModel<TModel> implements IPage {

  errors: string[] = [];
  filters: Filters;
  isLoading = false;
  isGettingStats = false;
  lastpageNo = 0;

  private handleError(err: any, callback?: (err: any) => any): Promise<void> {
    this.errors.push(err);
    if (callback) {
      return callback(err);
    } else {
      return Promise.reject(err);
    }
  }

  constructor(private options: PageOptions<TModel>) {
    super();
    if (options.items) {
      this.items = options.items;
    }
    options.serverPaging = options.serverPaging != undefined ? options.serverPaging : true;
    this.items = [];
    this.filters = new Filters({
      associatedList: this,
      filters: options.filters,
      location: options.location
    });
  }
  fetch(callback?: (err: any, page?: Page<TModel>) => any): Promise<Page<TModel>> {
    this.isLoading = true;
    const params = new ServerPageInput();

    if (!this.options.serverPaging) {
      params.serverPaging = false;
    } else {
      params.offset = (this.pageNo - 1) * this.options.pageSize || this.pageSize; // TODO - use skip
      params.limit = this.options.pageSize; // TODO - use take
      params.pageSize = this.options.pageSize || this.pageSize || 10;
      params.pageNo = this.pageNo;
      // params.serverPaging
    }

    this.filters.appendParams(params);

    return this.options.api.search(params)
      .then((page) => {
        this.isLoading = false;
        const items: TModel[] = [];
        page.data = page.data ? page.data : page.items;

        _(page.data).each((item) => {
          if (this.options.formatter) {
            item = this.options.formatter(item);
          }
          items.push(item);
        });

        this.items = items;
        this.total = this.items.length; // page.total || this.stats.total || this.items.length;
        this.pageNo = page.pageNo;
        this.totalRecords = page.totalRecords;
        this.pageSize = page.pageSize;

        this.lastpageNo = 1; // Math.ceil(this.total / (page.pageSize|| this.items.length));

        if (callback) {
          return callback(null, this);
        } else {
          return Promise.resolve(this);
        }

      })
      .catch(err => {
        this.isLoading = false;
        return this.handleError(err, callback);
      });

  }
  // autoComplete(callback?: (err: any, page?: Page<TModel>) => any) {
  //     this.isLoading = true;
  //     const params = new ServerPageInput();

  //     if (!this.options.serverPaging) {
  //         params.serverPaging = false;
  //     } else {
  //         params.offset = (this.pageNo - 1) * this.options.pageSize; // TODO - use skip
  //         params.limit = this.options.pageSize; // TODO - use take
  //         params.pageSize = this.options.pageSize || 10;
  //         params.pageNo = this.pageNo;
  //         // params.serverPaging
  //     }

  //     this.filters.appendParams(params);
  //     return this.options.api.autoComplete(params);
  // }
  add(param: TModel): Page<TModel> {
    this.items.push(param);
    return this;
  };

  remove(item: TModel): void {
    const id = item[this.options.fields.id];
    let found = false;
    if (this.items && this.items.length) {
      let i = this.items.length;
      while (i--) {
        if (this.items[i] && this.items[i][this.options.fields.id] === id) {
          this.items.splice(i, 1);
          found = true;
          break;
        }
      }
    }

    if (found) {
      this.total = this.total - 1;
    }
  }
  refresh(callback?: (err: any, page?: Page<TModel>) => any) {
    this.fetch(callback);
    return this;
  };

  clear() {
    this.total = 0;
    this.items = [];
  };

  pages(): number[] {
    const maxPages = this.pageNo;
    let index: number;

    const pageNos: number[] = [];
    if (this.lastpageNo < maxPages) {
      // total number of pages is less then 10
      for (index = 1; index <= this.lastpageNo; index++) {
        pageNos.push(index);
      }
      if (pageNos.length === 0) {
        pageNos.push(1);
      }
      return pageNos;
    }

    //  current page is less than max pages//
    if (this.pageNo < maxPages / 2) {
      for (index = 1; index <= maxPages; index++) {
        pageNos.push(index);
      }

      pageNos.push(-1);
      return pageNos;
    }

    // if current page is greater than 10//
    if (this.pageNo + maxPages / 2 >= this.lastpageNo) {
      pageNos.push(-2);

      for (index = this.lastpageNo - maxPages; index <= this.lastpageNo; index++) {
        pageNos.push(index);
      }

      return pageNos;
    }

    pageNos.push(-2);
    for (index = Math.ceil(this.pageNo - maxPages / 2); index <= Math.ceil(this.pageNo + maxPages / 2); index++) {
      pageNos.push(index);
    }
    pageNos.push(-1);
    return pageNos;
  };

  showPage(pageNo: number): Promise<Page<TModel>> {
    if (this.isLoading) {
      return;
    }
    if (pageNo === -2) {
      pageNo = 1;
      return;
    }

    if (pageNo === -1) {
      pageNo = this.lastpageNo;
      return;
    }
    this.pageNo = pageNo;
    return this.fetch();
  }

  showPrevious() {
    if (this.isLoading || this.pageNo <= 1) {
      return;
    }
    this.showPage(this.pageNo - 1);
  };
  showNext() {

    if (this.isLoading || this.lastpageNo <= this.pageNo) {
      return;
    }
    this.showPage(this.pageNo + 1);
  };


}

