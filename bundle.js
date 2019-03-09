(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/demo/demo.js":[function(require,module,exports){
const workshop_generator = require('../')
document.body.appendChild(workshop_generator())

},{"../":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/index.js"}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/node_modules/ipfs-mini/src/index.js":[function(require,module,exports){
var XMLHttpRequest = require('./lib/XMLHttpRequest');

module.exports = IPFS;

/**
 * The varructor object
 * @param {Object} `provider` the provider object
 * @return {Object} `ipfs` returns an IPFS instance
 * @throws if the `new` flag is not used
 */
function IPFS(provider) {
  if (!(this instanceof IPFS)) { throw new Error('[ipfs-mini] IPFS instance must be instantiated with "new" flag (e.g. var ipfs = new IPFS("http://localhost:8545");).'); }

  var self = this;
  self.setProvider(provider || {});
}

/**
 * No operation method
 */
function noop() {}
function newPromise(val) { return new Promise(val); }
function noopPromise(val) { val(noop, noop); }

/**
 * Sets the provider of the IPFS instance
 * @param {Object} `provider` the provider object
 * @throws if the provider object is not an object
 */
IPFS.prototype.setProvider = function setProvider(provider) {
  if (typeof provider !== 'object') { throw new Error(`[ifpsjs] provider must be type Object, got '${typeof provider}'.`); }
  var self = this;
  var data = self.provider = Object.assign({
    host: '127.0.0.1',
    pinning: true,
    port: '5001',
    protocol: 'http',
    base: '/api/v0' }, provider || {});
  self.requestBase = String(`${data.protocol}://${data.host}:${data.port}${data.base}`);
};

/**
 * Sends an async data packet to an IPFS node
 * @param {Object} `opts` the options object
 * @param {Function} `cb` the provider callback
 * @callback returns an error if any, or the data from IPFS
 */
IPFS.prototype.sendAsync = function sendAsync(opts, cb) {
  var self = this;
  var request = new XMLHttpRequest(); // eslint-disable-line
  var options = opts || {};

  return (cb ? noopPromise : newPromise)(function (resolve, reject) {
    function callback(e, r){
      (cb || noop)(e, options.takeHash && r ? r.Hash : r);
      if (e) return reject(e);
      if (!e && r) return resolve(options.takeHash ? r.Hash : r);
    };

    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.timeout !== 1) {
        if (request.status !== 200) {
          callback(new Error(`[ipfs-mini] status ${request.status}: ${request.responseText}`), null);
        } else {
          try {
            callback(null, (options.jsonParse ? JSON.parse(request.responseText) : request.responseText));
          } catch (jsonError) {
            callback(new Error(`[ipfs-mini] while parsing data: '${String(request.responseText)}', error: ${String(jsonError)} with provider: '${self.requestBase}'`, null));
          }
        }
      }
    };

    try {
      var pinningURI = self.provider.pinning && opts.uri === '/add' ? '?pin=true' : '';

      if (options.payload) {
        request.open('POST', `${self.requestBase}${opts.uri}${pinningURI}`);
      } else {
        request.open('GET', `${self.requestBase}${opts.uri}${pinningURI}`);
      }

      if (options.accept) {
        request.setRequestHeader('accept', options.accept);
      }

      if (options.payload && options.boundary) {
        request.setRequestHeader('Content-Type', `multipart/form-data; boundary=${options.boundary}`);
        request.send(options.payload);
      } else {
        request.send();
      }
    } catch (err) {
      callback(err, null);
    }
  });
};

/**
 * creates a boundary that isn't part of the payload
 */
function createBoundary(data) {
  while (true) {
    var boundary = `----IPFSMini${Math.random() * 100000}.${Math.random() * 100000}`;
    if (data.indexOf(boundary) === -1) {
      return boundary;
    }
  }
}

/**
 * Add an string or buffer to IPFS
 * @param {String|Buffer} `input` a single string or buffer
 * @param {Function} `callback` a callback, with (error, ipfsHash String)
 * @callback {String} `ipfsHash` returns an IPFS hash string
 */
IPFS.prototype.add = function addData(input, callback) {
  var data = ((typeof input === 'object' && input.isBuffer) ? input.toString('binary') : input);
  var boundary = createBoundary(data);
  var payload = `--${boundary}\r\nContent-Disposition: form-data; name="path"\r\nContent-Type: application/octet-stream\r\n\r\n${data}\r\n--${boundary}--`;

  return this.sendAsync({
    jsonParse: true,
    accept: 'application/json',
    uri: '/add',
    takeHash: true,
    payload, boundary,
  }, callback);
};

/**
 * Add an JSON object to IPFS
 * @param {Object} `jsonData` a single JSON object
 * @param {Function} `callback` a callback, with (error, ipfsHash String)
 * @callback {String} `ipfsHash` returns an IPFS hash string
 */
IPFS.prototype.addJSON = function addJson(jsonData, callback) {
  var self = this;
  return self.add(JSON.stringify(jsonData), callback);
};

/**
 * Get an object stat `/object/stat` for an IPFS hash
 * @param {String} `ipfsHash` a single IPFS hash String
 * @param {Function} `callback` a callback, with (error, stats Object)
 * @callback {Object} `stats` returns the stats object for that IPFS hash
 */
IPFS.prototype.stat = function cat(ipfsHash, callback) {
  var self = this;
  return self.sendAsync({ jsonParse: true, uri: `/object/stat/${ipfsHash}` }, callback);
};

/**
 * Get the data from an IPFS hash
 * @param {String} `ipfsHash` a single IPFS hash String
 * @param {Function} `callback` a callback, with (error, stats Object)
 * @callback {String} `data` returns the output data
 */
IPFS.prototype.cat = function cat(ipfsHash, callback) {
  var self = this;
  return self.sendAsync({ uri: `/cat/${ipfsHash}` }, callback);
};

/**
 * Get the data from an IPFS hash that is a JSON object
 * @param {String} `ipfsHash` a single IPFS hash String
 * @param {Function} `callback` a callback, with (error, json Object)
 * @callback {Object} `data` returns the output data JSON object
 */
IPFS.prototype.catJSON = function catJSON(ipfsHash, callback) {
  var self = this;
  return self.sendAsync({ uri: `/cat/${ipfsHash}`, jsonParse: true }, callback);
};

},{"./lib/XMLHttpRequest":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/node_modules/ipfs-mini/src/lib/XMLHttpRequest-browser.js"}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/node_modules/ipfs-mini/src/lib/XMLHttpRequest-browser.js":[function(require,module,exports){
const XMLHttpRequest = window.XMLHttpRequest; // eslint-disable-line

module.exports = XMLHttpRequest;

},{}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/index.js":[function(require,module,exports){
const form = require('form')
const ens = require('register-ens')
const ipfs = require('publish-to-ipfs')
const make_workshop = require('make-workshop')

module.exports = workshop_generator
function workshop_generator () {
  const el = form({ publish, validate })
  return el
}

async function publish (domain, data) {
  const workshop_data = await make_workshop(data, true)
  const content = [workshop_data]
  const blob = new Blob(content, { type: 'text/html' })
  const bloburl = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')

  // const file = new File([`
  //   <!doctype html>
  //   <html>
  //     <head><meta charset="utf-8"></head>
  //     <body><script>
  //       console.log(location.href)
  //       console.log(URL)
  //       console.log(location.href)
  //       debugger
  //       var url = new URL('./workshop.json', location.href).href
  //       console.log(url)
  //
  //       // var data = await fetch(url).then(response => response.json())
  //
  //       document.body.innerHTML = "<h1>FOOBAR123 - \${url}</h1>"
  //     </script></body>
  //   </html>
  // `], "foo.html", { type: "text/html" })
  // const fileurl = URL.createObjectURL(file)
  // console.log('fileurl', fileurl)
  // // debugger
  // iframe.setAttribute('src', fileurl)
  iframe.setAttribute('src', bloburl)
  // iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts')
  document.body.appendChild(iframe)


  // const address = await ipfs.upload(workshop_data)
  // const success = await ens.publish(domain, address)
  console.log(domain, workshop_data.length)

  // if (success) el.innerHTML = 'success'
  // else el.innerHTML = 'fail'
}
async function validate (key, val) {
  debugger
  if (key === 'ens_domain') return await ens.isFree(val)
  // if (key === 'username')
  else return true
}

},{"form":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/form.js","make-workshop":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/make-workshop.js","publish-to-ipfs":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/publish-to-ipfs.js","register-ens":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/register-ens.js"}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/form.js":[function(require,module,exports){
module.exports = form

function form ({ validate, publish }) {
  const el = document.createElement('div')
  el.style = `flex-direction: column; width: 500px; display: flex;`
  el.innerHTML = `
    <h1> generate workshop </h1>
    <input name="title" placeholder="title" value="title1">
    <input name="version" placeholder="version" value="1.0.0">
    <input name="ens_domain" placeholder="ens domain" value="example1.play.eth">
    <input name="icon" placeholder="icon" value="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/OOjs_UI_icon_book-ltr.svg/768px-OOjs_UI_icon_book-ltr.svg.png">
    <input name="chat" placeholder="chat" value="https://gitter.im/ethereum/play">
    <div class="lessons"><span><button>add</button><button>del</button></span></div>
    <div class="needs"><span><button>add</button><button>del</button></span></div>
    <div class="unlocks"><span><button>add</button><button>del</button></span></div>
    <button>publish</button>`
  const [,title,version,ens_domain,icon,chat,lessons,needs,unlocks,submit] = el.children
  ;[lessons, needs, unlocks].forEach((inputs, i) => {
    const [add, del] = [...inputs.firstChild.children]
    del.onclick = event => {
      const container = event.target.parentElement.parentElement
      const last = container.children.length - 1
      if (last < 1) return
      container.removeChild(container.children[last])
    }
    add.onclick = event => {
      const container = event.target.parentElement.parentElement
      const input = document.createElement('div')
      if (i === 0) input.innerHTML = `
        <input class="title" placeholder="title" value="lesson-titleX">
        <input class="lesson_url" placeholder="lesson_url" value="https://www.youtube.com/embed/ZnuwB35GYMY">
        <input class="tool_url" placeholder="tool_url" value="https://play.ethereum.org/play-editor">
        <textarea class="info" placeholder="info">foo bar baz</textarea>`
      else if (i === 1) input.innerHTML = `
        <input class="needs_url" placeholder="needs_url" value="https://play.ethereum.org/workshop-solidity">`
      else input.innerHTML = `
        <input class="unlocks_url" placeholder="unlocks_url" value="https://play.ethereum.org/workshop-solidity">`
      container.appendChild(input)
    }
    add.click()
  })
  title.onkeyup = async event => {
    title.style.backgroundColor = await validate('title', title.value) ? 'green' : 'red'
  }
  version.onkeyup = async event => {
    version.style.backgroundColor = await validate('version', version.value) ? 'green' : 'red'
  }
  ens_domain.onkeyup = async event => {
    ens_domain.style.backgroundColor = await validate('ens_domain', ens_domain.value) ? 'green' : 'red'
  }
  icon.onkeyup = async event => {
    icon.style.backgroundColor = await validate('icon', icon.value) ? 'green' : 'red'
  }
  chat.onkeyup = async event => {
    chat.style.backgroundColor = await validate('chat', chat.value) ? 'green' : 'red'
  }
  submit.onclick = event => publish(ens_domain.value, {
    title: title.value,
    version: version.value,
    icon: icon.value,
    chat: chat.value,
    lessons: [...lessons.children].filter((_,i) => i).map(L => {
      const [title, lesson, tool, info] = [...L.children].map(x => x.value)
      return { title, lesson, tool, info: [info] }
    }),
    needs: [...needs.children].filter((_,i) => i).map(L => L.children[0].value),
    unlocks: [...unlocks.children].filter((_,i) => i).map(L => L.children[0].value),
  })
  return el
}

},{}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/make-workshop.js":[function(require,module,exports){
const url = new URL('script.txt', location.href).href
const get = async () => (s || (s = await fetch(url).then(x => x.text())))
let s

module.exports = make_workshop

async function make_workshop (data, iframe) {
  // @TODO: generate for IFRAME
  // @TODO: vs. generate for IPFS
  const source = `;(() => { ${await get()} })();
  setTimeout(async () => {
    var app = await workshop(${iframe ? JSON.stringify(data) : ''})
    const el = await app.render()
    document.body.appendChild(el)
  }, 0)
  var st = document.createElement('style')
  st.innerHTML = \`
    html {
      box-sizing: border-box;
      display: table;
      min-width: 100%;
      margin: 0;
    }
    body {
      box-sizing: border-box;
      margin: 0;
      display: flex;
      flex-flow: column;
      height: 100vh;
    }\`
  document.head.appendChild(st)`
  // var sss1 = source.indexOf(', location.href)')
  // console.log('sss1', sss1)
  if (iframe) {
    var source2 = source.replace(', location.href)', ', location.href.startsWith("blob:") ? location.href.split("blob:")[1] : location.href)')
  }
  // var sss2 = source2.indexOf(', location.href)')
  // console.log('sss2', sss2)
  return `<!doctype html><html>
    <head><meta charset="utf-8"></head>
    <body><script>${iframe ? source2 : source}</script></body>
  </html>`
}

},{}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/publish-to-ipfs.js":[function(require,module,exports){
module.exports = publish_to_ipfs

async function publish_to_ipfs () {
  return 'publish to ipfs'
}

const IPFS = require('ipfs-mini');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

const button = document.createElement('button')
document.body.appendChild(button)
button.innerHTML = 'IPFS'
button.onclick = async () => {

  const x1 = await ipfs.add('hello world!').catch(console.log)
  console.log('x1', x1)
  // result null 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'
  ipfs.cat('QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j', (err, x2) => {
    if (err) return console.error(err)
    console.log('x2', x2)
  })
  // result null 'hello world!'
  ipfs.addJSON({ somevalue: 2, name: 'Nick' }, async (err, x3) => {
    if (err) return console.error(err)
    console.log('x3', x3)
    const x4 = await ipfs.catJSON(x3).catch(console.error);
    console.log('x4', x4)
    // result null 'QmTp2hEo8eXRp6wg7jXv1BLCMh5a4F3B7buAUZNZUu772j'
    // result null { somevalue: 2, name: 'Nick' }
  })

}

},{"ipfs-mini":"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/node_modules/ipfs-mini/src/index.js"}],"/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/src/node_modules/register-ens.js":[function(require,module,exports){
module.exports = register_ens

async function register_ens () {
  return {
    async isFree (domain) { return true },
    async publish (domain, address) { return true }
  }
}

},{}]},{},["/home/serapath/Desktop/ETH_PARIS/generate-play-workshop/demo/demo.js"]);
