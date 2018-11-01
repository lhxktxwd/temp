const Crawler = require('./crawler');

const crawler = new Crawler({
    urlTarget: 'https://gitlab.leke.cn/lekeweb/leke-homework/tree/master',
    urlOrigin:'https://gitlab.leke.cn',
    username: 'lihexinkai@cnstrong.cn',
    password: '1kuaiqian.',
  })
  
  crawler.run()