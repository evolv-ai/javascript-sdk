const scopedHandlers = new Map();
const scopedOnceHandlers = new Map();
const scopedPayloads = new Map();

function ensureScope(scope) {
	if (scopedHandlers.has(scope)) {
		return;
	}

	scopedHandlers.set(scope, {});
	scopedOnceHandlers.set(scope, {});
	scopedPayloads.set(scope, {});
}

export function destroyScope(scope) {
	scopedHandlers.delete(scope);
	scopedOnceHandlers.delete(scope);
	scopedPayloads.delete(scope);
}

export function waitFor(scope, it, handler) {
	ensureScope(scope);

	const handlers = scopedHandlers.get(scope);
	const payloads = scopedPayloads.get(scope);

	if (!handlers[it]) {
		handlers[it] = [handler];
	} else {
		handlers[it].push(handler);
	}

	if (payloads[it]) {
		handler.apply(undefined, payloads[it]);
	}
}

export function waitOnceFor(scope, it, handler) {
	ensureScope(scope);

	const onceHandlers = scopedOnceHandlers.get(scope);
	const payloads = scopedPayloads.get(scope);

	if (payloads[it]) {
		handler.apply(undefined, payloads[it]);
		return;
	}

	if (!onceHandlers[it]) {
		onceHandlers[it] = [handler];
	} else {
		onceHandlers.push(handler);
	}
}

export function removeListener(scope, it, handler) {
	ensureScope(scope);

	const handlers = scopedHandlers.get(scope)[it];
	const index = handlers.findIndex(function(fn) {
		return fn === handler;
	});

	if (index !== -1) {
		handlers.splice(index, 1);
	}
}

export function emit(scope, it) {
	ensureScope(scope);

	const handlers = scopedHandlers.get(scope);
	const onceHandlers = scopedOnceHandlers.get(scope);
	const payloads = scopedPayloads.get(scope);

	const payload = [].slice.call(arguments);
	payload.shift();
	payloads[it] = payload;

	const oh = onceHandlers[it];
	while (oh && oh.length) {
		let handler = oh.shift();
		try {
			handler.apply(undefined, payload);
		} catch (err) {
			console.error(err);
			console.log('Failed to invoke one time handler of %s', it);
		}
	}

	const handlersForIt = handlers[it];
	if (!handlersForIt) {
		return;
	}
	handlersForIt.forEach(function(h) {
		try {
			h.apply(undefined, payload);
		} catch (err) {
			console.error(err);
			console.log('Failed to invoke handler of %s', it);
		}
	});
}
