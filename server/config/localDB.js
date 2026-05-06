const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const setNestedKey = (obj, key, value) => {
    const keys = key.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
};

const unsetNestedKey = (obj, key) => {
    const keys = key.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) return;
        current = current[keys[i]];
    }
    delete current[keys[keys.length - 1]];
};

class LocalQuery {
    constructor(model, query, isSingle = false) {
        this.model = model;
        this.query = query;
        this.isSingle = isSingle;
        this.options = {
            populate: [],
            select: null,
            sort: null,
            skip: 0,
            limit: null
        };
    }

    select(fields) { this.options.select = fields; return this; }
    populate(path) { this.options.populate.push(path); return this; }
    sort(order) { this.options.sort = order; return this; }
    skip(n) { this.options.skip = n; return this; }
    limit(n) { this.options.limit = n; return this; }

    async exec() {
        let data = this.model._read();
        
        // Filter
        let results = data.filter(item => {
            for (let key in this.query) {
                if (key.includes('.')) {
                    const keys = key.split('.');
                    let val = item;
                    for (const k of keys) val = val?.[k];
                    if (val !== this.query[key]) return false;
                    continue;
                }
                if (this.query[key] instanceof RegExp) {
                    if (!this.query[key].test(item[key])) return false;
                } else if (this.query[key] && typeof this.query[key] === 'object') {
                    if (this.query[key].$gte && new Date(item[key]) < new Date(this.query[key].$gte)) return false;
                    if (this.query[key].$lte && new Date(item[key]) > new Date(this.query[key].$lte)) return false;
                } else if (item[key] !== this.query[key]) {
                    return false;
                }
            }
            return true;
        });

        // Sort (very basic)
        if (this.options.sort) {
            const key = Object.keys(this.options.sort)[0];
            const dir = this.options.sort[key];
            results.sort((a, b) => {
                if (a[key] < b[key]) return dir;
                if (a[key] > b[key]) return -dir;
                return 0;
            });
        }

        // Skip/Limit
        if (this.options.skip) results = results.slice(this.options.skip);
        if (this.options.limit) results = results.slice(0, this.options.limit);

        if (this.isSingle) {
            const item = results[0] || null;
            return this.model._wrap(item, this.options.populate);
        }

        return results.map(item => this.model._wrap(item, this.options.populate));
    }

    // Make it thenable so it can be awaited directly
    then(onFulfilled, onRejected) {
        return this.exec().then(onFulfilled, onRejected);
    }
}

class LocalModel {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, JSON.stringify([]));
  }

  _read() { return JSON.parse(fs.readFileSync(this.filePath, "utf8")); }
  _write(data) { fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2)); }

  _wrap(item, populatePaths = []) {
    if (!item) return null;
    const _this = this;

    const wrapped = {
      ...item,
      get id() { return this._id; },
      save: async function() {
        const data = _this._read();
        const index = data.findIndex(i => i._id === this._id);
        if (index !== -1) {
          const toSave = { ...this };
          ["save", "comparePassword", "select", "populate", "sort", "skip", "limit", "id"].forEach(k => delete toSave[k]);
          toSave.updatedAt = new Date().toISOString();
          data[index] = toSave;
          _this._write(data);
        }
        return this;
      },
      comparePassword: async function(candidate) {
        if (!this.password) return false;
        return bcrypt.compare(candidate, this.password);
      }
    };

    // Handle population if requested
    populatePaths.forEach(p => {
        const modelMap = { 'user': User, 'content': Content };
        const targetModel = modelMap[p];
        if (targetModel && typeof wrapped[p] === 'string') {
            const data = targetModel._read();
            const found = data.find(i => i._id === wrapped[p]);
            if (found) wrapped[p] = targetModel._wrap(found);
        }
    });

    return wrapped;
  }

  find(query = {}) { return new LocalQuery(this, query, false); }
  findOne(query = {}) { return new LocalQuery(this, query, true); }
  findById(id) { return this.findOne({ _id: id }); }

  async create(doc) {
    const data = this._read();
    let password = doc.password;
    if (password && this.name === "User") password = await bcrypt.hash(password, 12);
    const newDoc = {
      _id: crypto.randomBytes(12).toString("hex"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc,
      password: password
    };
    data.push(newDoc);
    this._write(data);
    return this._wrap(newDoc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const data = this._read();
    const index = data.findIndex(item => item._id === id);
    if (index === -1) return null;
    const item = data[index];
    if (update.$set) {
        for (let key in update.$set) setNestedKey(item, key, update.$set[key]);
    } else if (update.$inc) {
        for (let key in update.$inc) {
            const keys = key.split('.');
            let current = item;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = (current[keys[keys.length - 1]] || 0) + update.$inc[key];
        }
    } else if (update.$unset) {
        for (let key in update.$unset) unsetNestedKey(item, key);
    } else {
        for (let key in update) setNestedKey(item, key, update[key]);
    }
    item.updatedAt = new Date().toISOString();
    this._write(data);
    return this._wrap(item);
  }

  async findOneAndDelete(query) {
    const data = this._read();
    const index = data.findIndex(item => {
      for (let key in query) if (item[key] !== query[key]) return false;
      return true;
    });
    if (index === -1) return null;
    const deleted = data.splice(index, 1)[0];
    this._write(data);
    return this._wrap(deleted);
  }

  async countDocuments(query = {}) {
    const res = await this.find(query).exec();
    return res.length;
  }

  async findOneAndUpdate(query, update, options = {}) {
      const item = await this.findOne(query).exec();
      if (!item) return null;
      return this.findByIdAndUpdate(item._id, update, options);
  }

  aggregate(pipeline = []) {
      const query = new LocalQuery(this, {}, false);
      query.exec = async () => []; // Mock aggregate
      return query;
  }
}

const User = new LocalModel("User");
const Content = new LocalModel("Content");
const ScheduledPost = new LocalModel("ScheduledPost");

module.exports = { User, Content, ScheduledPost };
