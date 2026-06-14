import request from './index.js'

export function getBooks(params) {
  return request({
    url: '/books/',
    method: 'get',
    params
  })
}

export function getBook(id) {
  return request({
    url: `/books/${id}`,
    method: 'get'
  })
}

export function createBook(data) {
  return request({
    url: '/books/',
    method: 'post',
    data
  })
}

export function updateBook(id, data) {
  return request({
    url: `/books/${id}`,
    method: 'put',
    data
  })
}

export function deleteBook(id) {
  return request({
    url: `/books/${id}`,
    method: 'delete'
  })
}

export function getBookPages(bookId, params) {
  return request({
    url: `/books/${bookId}/pages`,
    method: 'get',
    params
  })
}

export function addBookPage(bookId, data) {
  return request({
    url: `/books/${bookId}/pages`,
    method: 'post',
    data
  })
}

export function getPage(pageId) {
  return request({
    url: `/books/pages/${pageId}`,
    method: 'get'
  })
}

export function updatePage(pageId, data) {
  return request({
    url: `/books/pages/${pageId}`,
    method: 'put',
    data
  })
}

export function getBookVersions(bookId) {
  return request({
    url: `/books/${bookId}/versions`,
    method: 'get'
  })
}

export function createBookVersion(bookId, data) {
  return request({
    url: `/books/${bookId}/versions`,
    method: 'post',
    data
  })
}

export function getDynasties() {
  return request({
    url: '/books/dynasties',
    method: 'get'
  })
}
