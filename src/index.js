const form = require('form')
const ens = require('register-ens')
const ipfs = require('publish-to-ipfs')
const make_workshop = require('make-workshop')

module.exports = workshop_generator
function workshop_generator () {
  const el = form({ onsubmit, onfield })
  return el
}


async function onsubmit (data) {
  const domain = data.eth_domain // user choice
  const workshop_data = make_workshop(data)
  const address = await ipfs.upload(workshop_data)
  const success = await ens.publish(domain, address)
  if (success) el.innerHTML = 'success'
  else el.innerHTML = 'fail'
}
async function onfield ({ key, val }) {
  if (key === 'eth_domain') return await ens.isFree(val)
  // if (key === 'username')
  else return true
}
