!function(e){var t={};function n(i){if(t[i])return t[i].exports;var o=t[i]={i:i,l:!1,exports:{}};return e[i].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(i,o,function(t){return e[t]}.bind(null,o));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n.oe=function(e){process.nextTick((function(){throw e}))},n(n.s=2)}([function(e,t){e.exports=base64-arraybuffer},function(e,t){e.exports=deepmerge},function(e,t,n){"use strict";n.r(t);var i=n(1);const o=n.n(i).a;function r(e){return JSON.parse(JSON.stringify(e))}function s(e){return"object"==typeof e&&null!==e&&!Array.isArray(e)}function c(e,t){return function e(n,i){let o=[];return Object.keys(n).filter(t||function(){return!0}).forEach((function(t){let r=n[t],c=i?i+"."+t:t;o.push(c),s(r)&&(o=o.concat(e(n[t],c)))})),o}(e,"")}function u(e,t){return function e(t,n,i){let o=t[n];return n===t.length-1?(delete i[o],!0):o in i&&(e(t,n+1,i[o])&&0===Object.keys(i[o]).length?(delete i[o],!0):void 0)}(e.split("."),0,t)}function d(e,t){let n,i=t,o=e.split(".");for(let e=0;e<o.length;e++){let t=o[e];if(e===o.length-1){n=i[t];break}if(!(t in i))break;i=i[t]}return n}function a(e,t,n){let i=n,o=e.split(".");for(let e=0;e<o.length;e++){let n=o[e];if(e===o.length-1){i[n]=t;break}n in i||(i[n]={}),i=i[n]}return t}function f(e,t){const n=function(e,t){return function e(n,i){let o={};return Object.keys(n).filter(t||function(){return!0}).forEach((function(t){let r=n[t],c=i?i+"."+t:t;s(r)?o=l(o,e(n[t],c)):o[c]=r})),o}(e,"")}(e),i={};return t.forEach((function(e){e in n&&(i[e]=n[e])})),function(e){let t={};return Object.keys(e).forEach((function(n){a(n,e[n],t)})),t}(i)}function l(e,t){if(Object.assign)return Object.assign.apply(void 0,arguments);if(null==e)throw new TypeError("Cannot convert undefined or null to object");const n=Object(e);for(let e=1;e<arguments.length;e++){let t=arguments[e];if(null!=t)for(let e in t)t.hasOwnProperty(e)&&(n[e]=t[e])}return n}const h=new Map,p=new Map,v=new Map;function g(e){h.has(e)||(h.set(e,{}),p.set(e,{}),v.set(e,{}))}function y(e,t,n){g(e);const i=h.get(e),o=v.get(e);i[t]?i[t].push(n):i[t]=[n],o[t]&&n.apply(void 0,o[t])}function m(e,t,n){g(e);const i=p.get(e),o=v.get(e);o[t]?n.apply(void 0,o[t]):i[t]?i.push(n):i[t]=[n]}function b(e,t){g(e);const n=h.get(e),i=p.get(e),o=v.get(e),r=[].slice.call(arguments);r.shift(),o[t]=r;const s=i[t];for(;s&&s.length;){let e=s.shift();try{e.apply(void 0,r)}catch(e){console.error(e),console.log("Failed to invoke one time handler of %s",t)}}const c=n[t];c&&c.forEach((function(e){try{e.apply(void 0,r)}catch(e){console.error(e),console.log("Failed to invoke handler of %s",t)}}))}var x=function(){let e,t,n,i,s=!1;function c(){if(!s)throw new Error("Evolv: The evolv context is not initialized")}Object.defineProperty(this,"uid",{get:function(){return e}}),Object.defineProperty(this,"sid",{get:function(){return t}}),Object.defineProperty(this,"remoteContext",{get:function(){return r(n)}}),Object.defineProperty(this,"localContext",{get:function(){return r(i)}}),this.initialize=function(o,c,u,d){if(s)throw new Error("Evolv: The context is already initialized");e=o,t=c,n=u?r(u):{},i=d?r(d):{},s=!0,b(this,"context.initialized",this.resolve())},this.destroy=function(){n=void 0,i=void 0,b(this,"context.destroyed",this)},this.resolve=function(){return c(),r(o(i,n))},this.set=function(e,t,o){c();const r=o?i:n,s=d(e,r);a(e,t,r);const u=this.resolve();void 0===s?b(this,"context.value.added",e,t,o,u):b(this,"context.value.changed",e,t,s,o,u),b(this,"context.changed",u)},this.remove=function(e){c();const t=u(e,i),o=u(e,n),r=t||o;if(r){const t=this.resolve();b(this,"context.value.removed",e,!o,t),b(this,"context.changed",t)}return r},this.get=function(e){return c(),n[e]||i[e]},this.contains=function(e){return c(),e in n||e in i}};const E=function(e,t){t.call(this,e)};class w{constructor(e){this._responseArgs=null,this._errored=!1,this._thens=[],this._catches=[],this._finallys=[];const t=function(e,t){if(this._responseArgs)throw Error("Response already sent");const n=Array.prototype.slice.call(arguments);n.shift(),n.shift(),this._errored=e,this._responseArgs=arguments,this._catches.forEach(E.bind(this,arguments)),this._finallys.forEach(E.bind(this,arguments))},n=t.bind(this,!0,this._catches),i=t.bind(this,!1,this._thens);try{e(i,n)}catch(e){n(e)}}then(e){!this._responseArgs||this._errored?this._thens.push(e):E.call(this,this._responseArgs,e)}catch(e){this._responseArgs&&this._errored?E.call(this,this._responseArgs,e):this._catches.push(e)}finally(e){this._responseArgs?E.call(this,this._responseArgs,e):this._finallys.push(e)}}w.createPromise=function(e){return new("undefined"!=typeof Promise?Promise:w)(e)};var _=n(0),O=n.n(_),k={encode:function(e){return"undefined"!=typeof btoa?btoa(e):Buffer.from(e).toString("base64")},decode:function(e){return"undefined"!=typeof atob?atob(e):Buffer.from(e,"base64").toString()},encodeFromArrayBuffer:O.a.encode,decodeToArrayBuffer:O.a.decode};const j={contains:function(e,t){return e.indexOf(t)>=0},equal:function(e,t){return e===t},exists:function(e){return null!==e},not_contains:function(e,t){return!(e.indexOf(t)>=0)},not_equal:function(e,t){return e!==t},not_regex_match:function(e,t){return e&&!e.match(t)},not_regex64_match:function(e,t){return!A(e,t)},not_starts_with:function(e,t){return!e.startsWith(t)},kv_contains:function(e,t){return t[0]in e&&e[t[0]].indexOf(t[1])>=0},kv_equal:function(e,t){return e[t[0]]===t[1]},kv_not_contains:function(e,t){return!(t[0]in e&&e[t[0]].indexOf(t[1])>=0)},kv_not_equal:function(e,t){return e[t[0]]!==t[1]},regex_match:function(e,t){return e&&e.match(t)},regex64_match:A,starts_with:function(e,t){return e.startsWith(t)}};function A(e,t){try{const n=k.decode(t);return e&&null!==e.match(function(e){if(!e.startsWith("/"))return new RegExp(e);const t=e.lastIndexOf("/");return new RegExp(e.substring(1,t),e.substring(t+1))}(n))}catch(e){return!1}}function T(e,t){const n=function e(t,n){if(void 0===t)return;const i=n.indexOf(".");if(0===i)throw new Error("Invalid variant key: "+n);return-1===i?n in t?t[n]:void 0:e(t[n.substring(0,i)],n.substring(i+1))}(e,t.field);return!(t.operator.startsWith("kv_")&&!n)&&!!j[t.operator](n,t.value)}function q(e,t,n,i,o){let r;return"combinator"in n?S(e,n,i,o):(r=T(e,n),(r?i:o).add({id:t.id,index:n.index,field:n.field}),r)}function S(e,t,n,i){const{rules:o}=t;if(!o)return!0;for(let r=0;r<o.length;r++){const s=q(e,t,o[r],n,i);if(s&&"or"===t.combinator)return!0;if(!s&&"and"===t.combinator)return!1}return"and"===t.combinator}const C=/^([a-z]+):\/\/([^/]+)(.*)/i;function I(){return"undefined"!=typeof crypto?crypto:msCrypto}function P(e){if("undefined"!=typeof TextEncoder)return(new TextEncoder).encode(e).buffer;const t=new ArrayBuffer(e.length),n=new Uint8Array(t);for(let t=0,i=e.length;t<i;t++)n[t]=e.charCodeAt(t);return t}function z(e){return e.then?e:w.createPromise((function(t,n){function i(e){n(e.toString())}e.oncomplete=function(e){t(e.target.result)},e.onerror=i,e.onabort=i}))}function M(e,t){return'keyId="'+e+'",algorithm="hmac-sha384",signature="'+t+'"'}function N(e){return w.createPromise((function(t,n){const i=new XMLHttpRequest;i.addEventListener("load",(function(){this.status>=400?n(this.statusText||"Evolv: Request failed "+this.status):200===this.status?t(JSON.parse(this.responseText)):202===this.status?t():(console.error("Evolv: Invalid status "+this.status+" for response "+this.responseText),n(msg))})),i.addEventListener("error",n),i.open(e.method,e.url,e.sync),i.setRequestHeader("Accept","application/json"),e.signature&&i.setRequestHeader("Signature",M(e.keyId,e.signature)),i.send(e.payload)}))}function R(e){return w.createPromise((function(t,i){const o=C.exec(e.url);if(!o)throw new Error("Evolv: Invalid endpoint URL");("http"===o[1]?Promise.resolve().then(n.t.bind(null,3,7)):Promise.resolve().then(n.t.bind(null,4,7))).then((function(n){const r=o[2],s=o[3],c={"Content-Type":"application/json;charset=UTF-8",Accept:"application/json","Content-Length":Buffer.byteLength(e.payload)};e.signature&&(c.Signature=M(e.keyId,e.signature));const u=n.request({hostname:r,path:s,method:e.method,headers:c},(function(e){e.on("data",t)}));u.on("error",i),u.write(e.payload),u.end()}))}))}function W(e){return w.createPromise((function(t,n){let i,o;i=e.data?"object"==typeof e.data?JSON.stringify(e.data):e.data:"",e=l({payload:i},e),o="undefined"!=typeof XMLHttpRequest?N:R,e.key?function(e,t){const n={name:"HMAC",hash:"SHA-384"},i=["sign"],o=I();return w.createPromise((function(r,s){z(o.subtle.importKey("raw",P(e),n,!0,i)).then((function(e){z(o.subtle.sign(n,e,t)).then((function(e){r(k.encodeFromArrayBuffer(e))})).catch(s)})).catch(s)}))}(e.key,P(e.payload)).then((function(i){o(l({signature:i},e)).then(t).catch(n)})).catch(n):o(e).then(t).catch(n)}))}function L(e,t,n){e.forEach((function(e){t.delete(e),n.add(e)}))}function B(e){return function(){try{e.apply(void 0,arguments)}catch(e){console.log(e)}}}function D(e,t){return d(e,t)}function F(e,t,n){return d(e,n)}function H(e,t){return e.has(t)}function J(e,t){const n=[];return e.forEach((function(e){t&&!e.startsWith(t)||n.push(e)})),n}function U(e,t,n){if(!n._experiments||!n._experiments.length)return{};function i(e,t,n,o,r){if(t._predicate){if(function(e,t){const n={passed:new Set,failed:new Set};return n.rejected=!S(e,t,n.passed,n.failed),n}(e,t._predicate).rejected)return void o.push(n)}t._is_entry_point&&r.push(n),Object.keys(t).forEach((function(s){s.startsWith("_")||i(e,t[s],n?n+"."+s:s,o,r)}))}const o=t.resolve(),r={};return n._experiments.forEach((function(e){const t=l({},e);delete t.id;const n={disabled:[],entry:[]};i(o,t,"",n.disabled,n.entry),r[e.id]=n})),r}var K=function(e){const t=e.endpoint+"/"+e.env,n=e.auth&&e.auth.id,i=e.auth&&e.auth.secret,s=e.version||1;let u,d=!1,a=!1,h=!0,p=!1,v={},g={},m=null,x=null,E=!1,_=!1;const O={needed:new Set,requested:new Set,loaded:new Set},k={entry:new Set,active:new Set,needed:new Set,requested:new Set,loaded:new Set};let j=[],A=[],T=new Set;function q(){if(!x)return;const e=U(0,u,x);k.active.clear(),k.entry.clear(),g={},Object.keys(e).forEach((function(t){const n=e[t];O.loaded.forEach((function(e){if(!n.disabled.some((function(t){return e.startsWith(t)}))){k.active.add(e),n.entry.some((function(t){return e.startsWith(t)}))&&k.entry.add(e)}})),t in v&&(g=o(g,f(v[t],k.active)))})),b(u,"effective.genome.updated",g),T.forEach((function(e){try{e(g,x)}catch(e){console.error(e)}}))}function S(e,t,n){let i=e?k:O;t.forEach(i.requested.delete.bind(i.requested)),e?(b(u,"config.request.received",t),function(e){x=e,_=!1,e._experiments.forEach((function(e){const t=l({},e);delete t.id,c(t,(function(e){return!e.startsWith("_")})).forEach(k.loaded.add.bind(k.loaded))}))}(n)):(b(u,"genome.request.received",t),function(e){const t=[],n=[];m=e,E=!1,e.forEach((function(e){const i=l({},e);delete i.genome,delete i.audience_query,t.push(i),i.excluded?n.push(i.eid):(v[i.eid]=e.genome,c(e.genome,(function(e){return!e.startsWith("_")})).forEach(O.loaded.add.bind(O.loaded)))})),u.set("experiments.allocations",t),u.set("experiments.exclusions",n)}(n)),q();let o=[],r=[];j.concat(A).forEach((function(n){if(!("genome"!==n.source||n.key&&O.loaded.has(n.key)))return;let i=!0;n.key&&(i=!1,k.loaded.forEach((function(e){n.key.startsWith(e)&&(i=!0)}))),(i||e&&(1===s||t.indexOf(n.key)>=0))&&(n.resolve(n.transform(n.key,g,x)),("config"===n.source?o:r).push(n))})),j=j.filter((function(e){return r.indexOf(e)<0})),A=A.filter((function(e){return o.indexOf(e)<0})),b(u,e?"config.updated":"genome.updated",n)}function C(e,t,n){let i,o;p=!0,console.log(n),b(u,"request.failed",e?"config":"genome",t,n),i=e?k:O,L(t,i.requested,i.needed),e?(o=A,_=!0):(o=j,E=!0);let r=[],c=[];j.concat(A).forEach((function(e){if(1===s||t.indexOf(e.key)>=0){("config"===e.source?r:c).push(e);try{e.reject(n)}catch(e){console.error(e)}}})),j=j.filter((function(e){return c.indexOf(e)>=0})),A=A.filter((function(e){return r.indexOf(e)>=0})),e?A=o:j=o}function I(e){if(d)if(e||h){if(h=!1,k.needed.size||1===s){const e=[];k.needed.forEach(e.push.bind(e)),k.needed.clear(),W({method:"get",url:t+"/configuration.json",keyId:n,key:i}).then(S.bind(this,!0,e)).catch(C.bind(this,!0,e)),L(e,k.needed,k.requested),b(u,"config.request.sent",e)}if(O.needed.size||1===s){const e=[];O.needed.forEach(e.push.bind(e)),O.needed.clear(),W({method:"post",url:t+"/allocations",keyId:n,key:i,data:{uid:u.uid,sid:u.uid}}).then(S.bind(this,!1,e)).catch(C.bind(this,!1,e)),L(e,O.needed,O.requested),b(u,"genome.request.sent",e)}a=!1}else a||(a=!0,setTimeout(I.bind(void 0,!0)));else h=h||e}function P(e,t,n){let i=null,o=null;const r=w.createPromise((function(e,t){i=B(e),o=B(t)}));let c,u,d;r.listen=function(e){T.add((function(i,o){e(t(n,i,o))}))};let a=!1;if("genome"===e?(c=O,u=E,d=j,a=c.loaded.has(n)):(c=k,u=_,d=A,c.loaded.forEach((function(e){n&&!n.startsWith(e)||(a=!0)}))),a)return i(t(n,g,x)),r;if(c.loaded.has(n))return i(t(n,g,x)),r;if(u)return o("The values could not be retrieved"),r;const f={key:n,resolve:i,reject:o,transform:t,source:e};return d.push(f),1===s||c.needed.has(n)||c.requested.has(n)||(c.needed.add(n),"genome"===e&&k.needed.add(n),I()),r}if(this.destroy=function(){v=void 0,g=void 0,m=void 0,x=void 0,delete O.needed,delete O.requested,delete O.loaded,delete k.entry,delete k.active,delete k.needed,delete k.requested,delete k.loaded,j.forEach((function(e){e.reject()})),j=void 0,A.forEach((function(e){e.reject()})),A=void 0,T=void 0,b(u,"store.destroyed",this),u=void 0},1===s)I(!0);else if(2!==e.version)throw new Error("Unsupported API version");Object.defineProperty(this,"state",{get:function(){return{allocations:r(m),config:r(x)}}}),this.fetch=I.bind(this,!0),this.preload=function(e,t,n){e.forEach(k.needed.add.bind(k.needed)),t||e.forEach(O.needed.add.bind(O.needed)),I(n)},this.initialize=function(e){if(d)throw new Error("Evolv: The store has already been initialized.");u=e,d=!0,I(),y(u,"context.changed",q)},this.subscribe=T.add.bind(T),this.unsubscribe=T.delete.bind(T),this.get=P.bind(this,"genome",D.bind(this)),this.getConfig=P.bind(this,"config",F.bind(this)),this.isActive=P.bind(this,"config",H.bind(this,k.active)),this.getActiveKeys=P.bind(this,"config",J.bind(this,k.active))};function V(e){let t,n=[];function i(e,t,n){return"undefined"!=typeof window&&window.navigator.sendBeacon?window.navigator.sendBeacon(e,t):function(e,t,n){return W({method:"post",url:e,data:t,sync:n}).catch((function(e){console.log(e)})),!0}(e,t,n)}function o(){let r=!1;if(void 0!==this){const e=this.event&&this.event.type;r="unload"===e||"beforeunload"===e}if(!n.length)return;const s=n;n=[],t&&clearTimeout(t),t=void 0,s.forEach((function(t){const o=e.match(new RegExp("\\/(v\\d+)\\/\\w+\\/([a-z]+)$"));if("analytics"===o[2]&&"v1"===o[1])return;let s=t;"v1"===o[1]&&(s=t[1]||{},s.type=t[0]),i(e,JSON.stringify(s),r)||(n.push(t),console.error("Evolv: Unable to send beacon"))})),n.length&&(t=setTimeout(o,1))}"undefined"!=typeof window&&(window.addEventListener("unload",o),window.addEventListener("beforeunload",o)),this.emit=function(e,i,r=!1){n.push([e,i]),r?o():t||(t=setTimeout(o,1))},this.flush=o}function X(e){let t=!1;if(!e.env)throw new Error('"env" must be specified');void 0===e.autoConfirm&&(e.autoConfirm=!0),e.endpoint=e.endpoint||"https://participants.evolv.ai/",e.version=e.version||1;const n=new x(e),i=new K(e),o=new V(e.endpoint+"/"+e.env+"/analytics"),r=new V(e.endpoint+"/"+e.env+"/events");Object.defineProperty(this,"context",{get:function(){return n}}),this.on=y.bind(void 0,n),this.once=m.bind(void 0,n),this.preload=i.preload.bind(i),this.get=i.get.bind(i),this.isActive=i.isActive.bind(i),this.getActiveKeys=i.getActiveKeys.bind(i),this.getConfig=i.getConfig.bind(i),this.emit=function(e,t,i){r.emit(e,l({uid:n.uid,sid:n.sid,score:t},n.remoteContext),i),b(n,X.EVENT_EMITTED,e,t)},this.confirm=function(){const e=n.remoteContext;if(!e.experiments||!e.experiments.allocations||!e.experiments.allocations.length)return[];e.experiments.allocations.forEach((function(e){r.emit("confirmation",l({uid:e.uid,sid:e.sid,eid:e.eid,cid:e.cid},n.remoteContext))})),r.flush(),b(n,X.CONFIRMED)},this.contaminate=function(){const e=n.remoteContext;if(!e.experiments||!e.experiments.allocations||!e.experiments.allocations.length)return[];e.experiments.allocations.forEach((function(e){r.emit("contamination",l({uid:e.uid,sid:e.sid,eid:e.eid,cid:e.cid},n.remoteContext))})),r.flush(),b(n,X.CONTAMINATED)},this.initialize=function(r,s,c,u){if(t)throw Error("Evolv: Client is already initialized");if(!r)throw new Error('Evolv: "uid" must be specified');if(!s)throw new Error('Evolv: "sid" must be specified');n.initialize(r,s,c,u),i.initialize(n),y(n,"context.initialized",(function(e,t){o.emit(e,n.remoteContext)})),y(n,"context.value.added",(function(e,t,n,i){i||o.emit(e,{key:t,value:n})})),y(n,"context.value.changed",(function(e,t,n,i,r){r||o.emit(e,{key:t,value:n})})),y(n,"context.value.removed",(function(e,t,n){n||o.emit(e,{key:t})})),e.autoConfirm&&(y("effective.genome.updated",this.confirm.bind(this)),y("request.failed",this.contaminate.bind(this))),t=!0,b(n,X.INITIALIZED,e)},this.flush=function(){r.flush(),o.flush()},this.destroy=function(){var e;this.flush(),i.destroy(),n.destroy(),e=n,h.delete(e),p.delete(e),v.delete(e)}}X.INITIALIZED="initialized",X.CONFIRMED="confirmed",X.CONTAMINATED="contaminated",X.EVENT_EMITTED="event.emitted";t.default=X},function(e,t){e.exports=http},function(e,t){e.exports=https}]);