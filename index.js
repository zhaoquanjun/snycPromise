// 消除异步传染性
// 重点是通过抛错来进行多次请求达到同步效果
const syncPromise = (func) => {
  if (typeof func !== 'function') {
    throw Error('please confirm the param to be a function')
  }
  let cache = []
  let i = 0
  window._fetch = window._fetch || window.fetch
  window.fetch = (...args) => {
    if (cache[i]) {
      if (cache[i].status == 'fulfilled') {
        return cache[i].data
      }
      if (cache[i].status == 'rejected') {
        throw cache[i].err
      }
      window.fetch = window._fetch
    } else {
      // 发送请求 然后报错
      const r = {
        status: 'pending',
        data: null,
        err: null,
      }
      cache[i++] = r
      const pro = _fetch(...args)
        .then(res => res.json())
        .then(
          resp => {
            r.status = 'fulfilled'
            r.data = resp
          },
          err => {
            r.status = 'rejected'
            r.err = err
          }
        )
      throw pro
    }
  }
  // 抛出错误
  try {
    func()
  } catch (err) {
    if (err instanceof Promise) {
      const reRun = () => {
        i = 0
        func()
      }
      err.then(reRun, reRun)
    }
  }
}