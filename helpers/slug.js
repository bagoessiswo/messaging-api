'use strict'
const Slug = require('slug')

module.exports = {
  generate: function (string) {
    Slug.defaults.mode = 'pretty'
    Slug.defaults.modes.pretty = {
      replacement: '-', // replace spaces with replacement
      symbols: true, // replace unicode symbols or not
      remove: null, // (optional) regex to remove characters
      lower: true, // result in lower case
      charmap: Slug.charmap, // replace special characters
      multicharmap: Slug.multicharmap // replace multi-characters
    }
    return Slug(string)
  }
}
