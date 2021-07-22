'use strict'

module.exports = {
  make: function (total, totalRows, limit, page, query, originalUrl) {
    // @TODO: Checking Pagination function
    let nextPage = (parseInt(page) + 1)
    let prevPage = (parseInt(page) - 1)
    let nextUrl = ''

    if (query === null) {
      nextUrl = process.env.APP_URL + originalUrl + '?page=' + nextPage
    } else if (originalUrl.search(/(page=)[^&?]+/g) <= 0) {
      nextUrl = process.env.APP_URL + originalUrl + '&page=' + nextPage
    } else {
      nextUrl = process.env.APP_URL + originalUrl.replace(/(page=)[^&?]+/g, '$1' + (nextPage))
    }

    return {
      total: parseInt(total),
      per_page: parseInt(limit),
      current_page: parseInt(page),
      last_page: Math.ceil(parseInt(total) / parseInt(limit)) === 'NaN' ? 0 : Math.ceil(parseInt(total) / parseInt(limit)),
      next_page_url: Math.ceil(parseInt(total) / parseInt(limit)) === parseInt(page) || parseInt(total) === 0 ? '' : nextUrl,
      prev_page_url: (parseInt(page) - 1) === 0 || (parseInt(page) - 1) < 0 ? '' : process.env.APP_URL + originalUrl.replace(/(page=)[^&?]+/g, '$1' + (prevPage)),
      from: ((parseInt(page) - 1) * parseInt(limit)) + 1,
      to: typeof totalRows !== 'undefined' ? (((parseInt(page) - 1) * parseInt(limit))) + totalRows : parseInt(total)
    }
  }
}
