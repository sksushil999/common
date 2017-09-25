import * as _ from 'lodash';

export function util(param) {
    return {
        isEmpty: function () {
            if (param === undefined || param === null) {
                return true;
            }
            if (_.isNumber(param) && param === 0) {
                return true;
            }
            if (_.isString(param) && (param === '0' || param === '' || param.match(/^ *$/) !== null)) {
                return true;
            }
            if (_.isArray(param) && _.isEmpty(param)) {
                return true;
            }

            return false;
        },
        hasValue: function () {
            return !this.isEmpty();
        }
    };
};
