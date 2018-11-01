const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const URL = require('url');

let $http = axios.create({
    withCredentials: true,// 获取 Cookie
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
    },
    validateStatus: status => (status >= 200 && status < 300 || status === 302)  // gitlab 登录 302 重定向
})

class Crawler {
    constructor(opts) {
        this.opts = Object.assign({
            url: '',
            username: '',
            password: '',
            cookie: {
                value: '',
                expires: 0,
            },
        }, opts)
    }

    async run() {
        const data = await this.getDoc();
        console.log(data);
    }

    async getDoc() {
        if (!this.opts.cookie.value || (this.opts.cookie.expires <= Date.now())) await this.login();

        const { data } = await $http.get(urlTarget, { headers: { Cookie: this.opts.cookie.value } });

        const $ = cheerio.load(data);

        return data;
    }

    login() {
        return new Promise(async (resolve, reject) => {
            try {
                const { urlOrigin } = this.opts
                const urlSignIn = `${urlOrigin}/users/sign_in`
                const resPageSignIn = await $http.get(urlSignIn)
                this._writeCookie(resPageSignIn.headers)
                const $ = cheerio.load(resPageSignIn.data)
                const $form = $('.login-body form')
                const action = $form.attr('action')
                const method = $form.attr('method')
                const params = {}
                params.utf8 = $form.find('[name="utf8"]').attr('value')
                params.authenticity_token = $form.find('[name="authenticity_token"]').attr('value')
                params.remember_me = 1  // true
                params.username = this.opts.username
                params.password = this.opts.password

                const reqOpts = {
                    maxRedirects: 0,
                    headers: {
                        Cookie: this.opts.cookie.value,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': JSON.stringify(params).length
                    }
                }
                // 302
                const resLogin = await $http[method](`${urlOrigin}${action}`, qs.stringify(params), reqOpts)
                this._writeCookie(resLogin.headers)
                return resolve()
            } catch (e) {
                console.error('Error On Page SignIn: ', e)
                return reject(e)
            }
        })
    }

    _writeCookie(headers) {
        const reg = /((?:_gitlab_session|remember_user_token)=[^;]*)/gi
        const regExpires = /expires=([^;]*)/gi
        let expires = Date.now()
        let cookies = []
        headers['set-cookie'].forEach(item => {
            const matched = item.match(reg)
            const matchedExpires = item.match(regExpires)
            if (matched) cookies.push(matched[0])
            if (matchedExpires) expires = new Date(matchedExpires[0]).getTime()
        })
        this.opts.cookie = {
            value: cookies.join(';'),
            expires
        }
    }
}

module.exports = Crawler