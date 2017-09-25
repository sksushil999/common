import * as _ from 'lodash';
import { util } from './util';
import * as moment from 'moment';


export function dateUtil(date) {


    const dateParser = (param) => {
        if (_.isDate(param)) {
            return param;
        }
        if (_.isNumber(param)) {
            return new Date(param);
        }
        if (util(param).isEmpty()) {
            return new Date();
        }
        if (moment.isMoment(param)) {
            return param.toDate();
        }
        if (param.toLowerCase().indexOf('z', param.length - 1) !== -1) {
            return moment(param).toDate();
        }

        const dateRE = /^\/Date\((-?\d+)(\+|-)?(\d+)?\)\/$/;
        const arr = param && dateRE.exec(param);
        if (arr) {
            return new Date(parseInt(arr[1], 10));
        }

        // dd/mm/yyyy dd-mm-yyyy  formatted
        let parsedDate = new Date();
        parsedDate.setDate(parseInt(param.substr(0, 2), 10));
        parsedDate.setMonth(parseInt(param.substr(3, 2), 10) - 1);
        parsedDate.setFullYear(parseInt(param.substr(6, 4), 10));
        return parsedDate;
    };

    date = dateParser(date);

    return {
        format:  (format, value) => {
            return moment(value || date).format(format);
        },
        inMonth:  (value) => {
            let days = [],
                day;
            value = value || date;
            for (day = 1; day <= moment(value).daysInMonth(); day++) {
                days.push(moment(value).set('date', day).toDate());
            }
            return days;
        },
        inWeek:  (value) => {
            let days = [],
                day;
            value = value || date;

            let start = moment(value).startOf('isoWeek').toDate();
            let end = moment(start).add(7, 'days').toDate();

            for (day = start; day < end; day = moment(day).add(1, 'days').toDate()) {
                days.push(day);
            }
            return days;
        },
        slots:  (options) => {
            let slots = [],
                index;
            let value = options.date || date;

            let start = options.start || 8;
            let count = options.count || 9;
            let step = options.step || 1;

            for (index = 0; index < count; index++) {
                slots.push(moment(value).set('hour', start + step * index)
                    .set('minute', 0)
                    .set('second', 0).toDate());
            }

            return slots;
        },
        parse: function () {
            return dateParser(date);
        },
        toDate: function () {
            return date;
        },
        toMoment: function () {
            return moment(date);
        },
        sameAs: function (date2, option) {
            option = option || 'date';

            let secondDate = dateParser(date2);

            if (option === 'date') {
                return moment(secondDate).format('DD-MM-YYYY') === moment(date).format('DD-MM-YYYY');
            } else if (option === 'time') {
                return moment(secondDate).format('HH:mm') === moment(date).format('HH:mm');
            }

            return false;
        },
        toString: function (option) {
            if (option === 'date') {
                return moment(date).format('DD-MM-YYYY');
            } else if (option === 'time') {
                return moment(date).format('HH:mm');
            }
        },
        toJSON: function () {
            return moment(date).toJSON();
        },
        sameDate: function (date2) {
            let secondDate = dateParser(date2);
            return moment(secondDate).format('DD-MM-YYYY') === moment(date).format('DD-MM-YYYY');
        },
        sameTime: function (date2) {
            let secondDate = dateParser(date2);
            return moment(secondDate).format('HH:mm') === moment(date).format('HH:mm');
        },
        withinTime: function (startTime, minutes) {
            let slot = dateParser(startTime);
            let fromTime = moment.duration(slot);
            let tillTime = moment.duration(slot).add(minutes, 'm');
            let time = moment.duration(date);

            return fromTime <= time && time < tillTime;
        },
        setTime: function (time, value) {
            let newTime = moment(time || new Date());
            return moment(value || date)
                .set('hour', newTime.hour())
                .set('minute', newTime.minute())
                .set('second', newTime.second());
        }
    };
}
