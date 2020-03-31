const invoker = function(args, fn) {
  fn.call(this, args);
};

export default function MiniPromise(executor) {
  this._responseArgs = null;
  this._errored = false;
  this._thens = [];
  this._catches = [];
  this._finallys = [];

  const response = function(errored, handlers) {
    if (this._responseArgs) {
      throw Error('Response already sent');
    }
    const args = Array.prototype.slice.call(arguments);
    // Drop the errored and handlers arguments from the binding
    args.shift();
    args.shift();
    this._errored = errored;
    this._responseArgs = arguments;
    this._catches.forEach(invoker.bind(this, arguments));
    this._finallys.forEach(invoker.bind(this, arguments));
  };

  const reject = response.bind(this, true, this._catches);
  const resolve = response.bind(this, false, this._thens);

  try {
    executor(resolve, reject);
  } catch (err) {
    reject(err);
  }

  this.then = function (handler) {
    if (this._responseArgs && !this._errored) {
      invoker.call(this, this._responseArgs, handler);
      return this;
    }

    this._thens.push(handler);
    return this
  }

  this.catch = function (handler) {
    if (this._responseArgs && this._errored) {
      invoker.call(this, this._responseArgs, handler);
      return this;
    }

    this._catches.push(handler);
    return this
  }

  this.finally = function (handler) {
    if (this._responseArgs) {
      invoker.call(this, this._responseArgs, handler);
      return this;
    }

    this._finallys.push(handler);
    return this;
  }
}

MiniPromise.createPromise = function (executor) {
  return new (typeof Promise !== 'undefined' ? Promise : MiniPromise)(executor);
};
