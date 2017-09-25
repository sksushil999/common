import { IApi, ServerPageInput } from './api';
import * as _ from 'lodash';
import * as moment from 'moment';

export class ModelOptions<TModel> {
  api: IApi<TModel>;
  properties: TModel;
  fields?= {
    id: 'id'
  };
  formatter?: (model: TModel) => TModel;
  onGet?: (err: any, model?: TModel) => any;
  onClear?: (err: any, model?: TModel) => any;
  onReset?: (err: any, model?: TModel) => any;
  onCreate?: (err: any, model?: TModel) => any;
  onUpdate?: (err: any, model?: TModel) => any;
  onRemove?: (err: any, model?: TModel) => any;
}

export class Model<TModel> {

  private originalModel: TModel;


  private formatter: (model: TModel) => TModel;

  properties: TModel
  errors: string[];

  id: any;

  isProcessing = false;
  isGetting = false;
  isCreating = false;
  isUpdating = false;
  isRemoving = false;
  isDirty = false;

  private setModel(model: TModel): void {
    this.originalModel = JSON.parse(JSON.stringify(model));
    this.properties = model;
    // _.each(this.properties, (value, key, obj) => {
    //     if (value && value != 0) {
    //         let m = moment.utc(value);
    //         obj[key] = m.isValid() ? new Date(m.toDate().toString()) : value;
    //     }
    // });
    this.id = this.options.fields ? model[this.options.fields.id] : model['id'];
    this.isDirty = false;
    if (this.errors) { this.errors.splice(0, this.errors.length); }
  };

  private handleError(err: any, callback?: (err: any, model?: TModel) => any): Promise<void> {
    if (this.errors) { this.errors.push(err); }
    if (callback) {
      return callback(err);
    } else {
      return Promise.reject(err);
    }
  }

  private handleCallback(model: TModel, callback?: (err: any, model?: TModel) => any): Promise<TModel> {
    if (callback) {
      return callback(null, model);
    } else {
      return Promise.resolve(model);
    }
  }

  markDirty(): Model<TModel> {
    this.isDirty = true;
    return this;
  };

  fetch(options: any, callback?: (err: any, model?: TModel) => any): Promise<TModel> {
    this.isGetting = true;
    this.isProcessing = true;
    const id = options ? (this.options.fields ? options[this.options.fields.id] : options) : 0;

    return this.options.api.get(id)
      .then(data => {
        this.isGetting = false;
        this.isProcessing = false;
        if (this.formatter) {
          data = this.formatter(data);
        }
        this.setModel(data);
        return this.handleCallback(this.properties, callback || this.options.onGet);
      })
      .catch(err => {
        this.isGetting = false;
        this.isProcessing = false;
        return this.handleError(err, callback || this.options.onCreate);
      });
  };

  get(options): Model<TModel> {
    this.fetch(options);
    return this;
  };

  set(data: TModel, callback?: (err: any, model?: TModel) => any): Model<TModel> {
    this.setModel(data);
    if (callback) {
      callback(null, this.properties);
    }
    return this;
  };

  reload(callback?: (err: any, model?: TModel) => any): Promise<TModel> {
    return this.fetch(this.id, callback);
  };

  clear(callback?: (err: any, model?: TModel) => any): Promise<TModel> {
    this.setModel(JSON.parse(JSON.stringify(this.options.properties)));
    return this.handleCallback(this.properties, callback || this.options.onClear);
  };

  reset(callback?: (err: any, model?: TModel) => any): Promise<TModel> {
    this.setModel(this.originalModel);
    return this.handleCallback(this.properties, callback || this.options.onReset);
  };

  create(callback?: (err: any, model?: TModel) => any): Promise<TModel> {
    this.isCreating = true;
    this.isProcessing = true;
    return this.options.api.create(this.properties)
      .then(model => {
        this.setModel(model);
        this.isCreating = false;
        this.isProcessing = false;
        return this.handleCallback(this.properties, callback || this.options.onCreate);
      }).catch(err => {
        this.isCreating = false;
        this.isProcessing = false;
        return this.handleError(err, callback || this.options.onCreate);
      });
  };

  update(callback?: (err: any, model?: TModel) => any, input?: ServerPageInput): Promise<TModel> {
    this.isUpdating = true;
    this.isProcessing = true;
    // const id = this.properties[this.options.fields.id];
    const id = this.properties['id'];
    return this.options.api.update(id, this.properties, input)
      .then(model => {
        this.setModel(model);
        this.isUpdating = false;
        this.isProcessing = false;
        return this.handleCallback(this.properties, callback || this.options.onUpdate);
      }).catch(err => {
        this.isUpdating = false;
        this.isProcessing = false;
        return this.handleError(err, callback || this.options.onUpdate);
      });
  };

  save(callback?) {
    // const id = this.properties[this.fields.id];
    const id = this.properties['id'];
    if (id && id !== 0) {
      return this.update(callback);
    } else {
      return this.create(callback);
    }
  };

  remove(callback?: (err: any, model?: TModel) => any): Promise<void> {
    this.isRemoving = true;
    this.isProcessing = true;
    // const id = this.properties[this.options.fields.id];
    const id = this.properties['id'];
    return this.options.api.remove(id)
      .then(() => {
        this.isRemoving = false;
        this.isProcessing = false;
        return this.clear(callback || this.options.onRemove);
      }).catch(err => {
        this.isRemoving = false;
        this.isProcessing = false;
        return this.handleError(err, callback || this.options.onRemove);
      });
  };

  constructor(private options: ModelOptions<TModel>) {
    this.properties = options.properties ? options.properties : null;
  }
};
