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
