import { Page, IPage } from './page';
import { util, dateUtil } from '../helpers';
import * as _ from 'lodash';
import { Location } from '@angular/common';
import { URLSearchParams } from '@angular/http';

export class FiltersOptions {
    associatedList: IPage;
    autoApply?= false;
    location?: Location;
    filters: any[];
}

export class Filter {
    field: '';
    value?: any;
    operator = 'eq';
    isSelected = false;
    skipUrl = false;
    constructor(param: any) {
        if (param.field) {
            this.field = param.field;
        } else {
            this.field = param;
        }

        if (param.value) {
            this.value = param.value;
        }

        if (param.operator) {
            this.operator = param.operator;
        }

        if (param.isSelected) {
            this.isSelected = param.isSelected;
        }

        if (param.skipUrl) {
            this.isSelected = param.skipUrl;
        }
    }
}

class FilterModel extends Filter {
    private originalValue: any;
    isEmpty = () => {
        return util(this.value).isEmpty();
    };

    set(value): Promise<IPage> {
        this.value = value;
        return this.filters.apply();
    };

    toggle(value: any): Promise<IPage> {
        if (this.value === value) {
            this.value = this.originalValue;
        } else {
            this.value = value;
        }

        return this.filters.apply();
    };
    reset(): Promise<IPage> {
        this.value = this.originalValue;
        return this.filters.apply();
    };

    go(): Promise<IPage> {
        return this.filters.apply();
    };

    constructor(criteria: any, private filters: Filters) {
        super(criteria);
        this.originalValue = this.value || '';
    }
}

export class Filters {

    items: FilterModel[] = [];
    properties = {};
    autoApply = true;
    // associatedList = options.;
    // autoApply = options.autoApply === false;

    location: Location;

    apply(callback?: (err: any, page?: IPage) => any): Promise<IPage> {
        if (this.autoApply) {
            return this.options.associatedList.fetch(callback);
        } else {
            return Promise.resolve(this.options.associatedList);
        }
    }


    find(field): FilterModel {
        return _.find(this.items, (item) => {
            return item.field === field;
        });
    }

    reset(): Promise<IPage> {
        _.each(this.items, (item) => {
            item.reset();
        });
        return this.apply();

    }

    set(options: Filter, callback?: (err: any, page?: IPage) => any): Promise<IPage> {
        const item = this.find(options.field);
        item.value = options.value;
        return this.apply(callback);
    }

    mute() {
        this.autoApply = false;
    }

    unmute() {
        this.autoApply = this.options.autoApply;
    }


    appendParams(params) {
        params = params || {};


        let urlSearchParams = this.location ? (new URLSearchParams(this.location.path().split('?')[1])) : null;

        let count = 0;

        _.each(this.items, (item) => {
            if (urlSearchParams && !item.skipUrl) {
                const value = _.isDate(item.value) ? dateUtil(item.value).toJSON() : item.value;
                urlSearchParams.set(item.field, util(value).isEmpty() ? null : value);
            }

            if (item.value && item.value !== '' && item.value !== 0) {
                // params['f[' + count + '][f]'] = item.field;
                // params['f[' + count + '][o]'] = item.operator;
                // params['f[' + count + '][v]'] = item.value;
                params.query[item.field] = item.value;
                count++;
            }
        });

        if (urlSearchParams) {
            let url = this.location.path().split('?')[0];
            this.location.replaceState(url, urlSearchParams.toString());
        }

        return params;
    }

    constructor(private options: FiltersOptions) {
        _.each(options.filters, (item) => {
            const model = new FilterModel(item, this);
            this.items.push(model);
            this.properties[model.field] = model;
        });
        this.location = options.location;
        this.autoApply = options.autoApply;
    }

}
