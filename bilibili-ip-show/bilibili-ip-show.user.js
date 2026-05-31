// ==UserScript==
// @name         Bilibili 评论区显示IP属地
// @namespace    https://github.com/xuchkang171/userscripts
// @version      1.0
// @description  在B站评论区显示评论的IP属地信息（提取自 Bilibili-Evolved by the1812）
// @author       Light_Quanta (原作者), 提取整理
// @match        https://www.bilibili.com/*
// @match        https://t.bilibili.com/*
// @match        https://space.bilibili.com/*
// @match        https://live.bilibili.com/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  const marginLeft = 15

  // ==================== 旧版评论区处理（bbComment） ====================

  const createListCon = function listCon(item, i, pos) {
    const blCon = this._parentBlacklistDom(item, i, pos)
    const con = [
      `<div class="con ${pos === i ? 'no-border' : ''}">`,
      `<div class="user">${this._createNickNameDom(item)}`,
      this._createLevelLink(item),
      this._identity(item.mid, item.assist, item.member.fans_detail),
      `${this._createNameplate(item.member.nameplate) + this._createUserSailing(item)}</div>`,
      this._createMsgContent(item),
      this._createPerfectReply(item),
      '<div class="info">',
      this._createPlatformDom(item.content.plat),
      '<span class="time-location">',
      '<span class="reply-time">'.concat(this._formateTime(item.ctime), '</span>'),
      item?.reply_control?.location
        ? `<span class="reply-location" style="margin-left:${marginLeft}px;">${item?.reply_control?.location || ''}</span>`
        : '',
      '</span>',
      item.lottery_id ? '' : `<span class="like ${item.action === 1 ? 'liked' : ''}"><i></i><span>${item.like ? item.like : ''}</span></span>`,
      item.lottery_id ? '' : `<span class="hate ${item.action === 2 ? 'hated' : ''}"><i></i></span>`,
      item.lottery_id ? '' : this._createReplyBtn(item.rcount),
      item.lottery_id && item.mid !== bbComment.userStatus.mid
        ? ''
        : `<div class="operation more-operation"><div class="spot"></div><div class="opera-list"><ul>${
            this._canSetTop(item) ? `<li class="set-top">${item.isUpTop ? '取消置顶' : '设为置顶'}</li>` : ''
          }${this._canBlackList(item.mid) ? '<li class="blacklist">加入黑名单</li>' : ''}${
            this._canReport(item.mid) ? '<li class="report">举报</li>' : ''
          }${this._canDel(item.mid) && !item.isTop ? `<li class="del" data-mid="${item.mid}">删除</li>` : ''}</ul></div></div>`,
      this._createLotteryContent(item.content),
      this._createVoteContent(item.content),
      this._createTags(item),
      '</div>',
      '<div class="reply-box">',
      this._createSubReplyList(item.replies, item.rcount, false, item.rpid, item.folder && item.folder.has_folded, item.reply_control),
      '</div>',
      '<div class="paging-box"></div>',
      '</div>',
    ].join('')
    return item.state === bbComment.blacklistCode ? blCon : con
  }

  const createSubReplyItem = function subReply(item, i) {
    return [
      `<div class="reply-item reply-wrap" data-id="${item.rpid}" data-index="${i}">`,
      this._createSubReplyUserFace(item),
      '<div class="reply-con"><div class="user">',
      this._createNickNameDom(item),
      this._createLevelLink(item),
      this._identity(item.mid),
      this._createSubMsgContent(item),
      '</div></div>',
      '<div class="info">',
      '<span class="time-location">',
      '<span class="reply-time">'.concat(this._formateTime(item.ctime), '</span>'),
      item?.reply_control?.location
        ? `<span class="reply-location" style="margin-left:${marginLeft}px;">${item?.reply_control?.location || ''}</span>`
        : '',
      '</span>',
      `<span class="like ${item.action === 1 ? 'liked' : ''}"><i></i><span>${item.like ? item.like : ''}</span></span>`,
      `<span class="hate ${item.action === 2 ? 'hated' : ''}"><i></i></span>`,
      '<span class="reply btn-hover">回复</span>',
      `<div class="operation btn-hover btn-hide-re"><div class="spot"></div><div class="opera-list"><ul>${
        this._canBlackList(item.mid) ? '<li class="blacklist">加入黑名单</li>' : ''
      }${this._canReport(item.mid) ? '<li class="report">举报</li>' : ''}${
        this._canDel(item.mid) ? `<li class="del" data-mid="${item.mid}">删除</li>` : ''
      }</ul></div></div>`,
      '</div></div>',
    ].join('')
  }

  let bbComment = null

  const oldCommentObserver = new MutationObserver(() => {
    if (typeof unsafeWindow.bbComment !== 'undefined') {
      bbComment = unsafeWindow.bbComment
      const isBlackroom = unsafeWindow.location.href.split('/')[3] === 'blackroom'
      if (isBlackroom) {
        bbComment.prototype._unhtmlFix = function (e, n) {
          return e ? e.replace(n || /[&<">'](?(amp|lt|quot|gt|#39|nbsp|#\d+);)?/g, function (e, n) {
            return n ? e : { '<': '', '&': '', '"': '', '>': '', "'": '' }[e]
          }) : ''
        }
        bbComment.prototype._trimHttpFix = function (e) { return e ? e.replace(/^http:/, '') : '' }
        bbComment.prototype._webpFix = function (e, n) {
          if (!e) return e
          const t = e.match(/(.*\.(jpg|jpeg|gif|png|bmp))(\?.*)?/)
          let r = -1 !== e.indexOf('/bfs/')
          if (!t || 'gif' === t[2] || 'bmp' === t[2] || !r) return e
          r = n.w; e = n.h
          e = r && e ? `@${r}w_${e}h` : '@'
          n = t[3] || ''
          return this.isWebp ? `${t[1] + e}.webp${n}` : `${t[1] + e}.${t[2]}${n}`
        }
        bbComment.prototype._createListCon = function (e, n, t) {
          const r = this._parentBlacklistDom(e, n, t)
          const i = [
            `<div class="con ${t === n ? 'no-border' : ''}">`,
            `<div class="user">${this._identity(e.mid, e.assist, e.member.fans_detail)}`,
            `<a data-usercard-mid="${e.mid}" href="//space.bilibili.com/${e.mid}" target="_blank" class="name ${this._createVipClass(e.member.vip.vipType, e.member.vip.vipStatus, e.member.vip.themeType)}">${this._unhtmlFix(e.member.uname)}</a>`,
            `<a class="level-link" href="//www.bilibili.com/blackboard/help.html" target="_blank"><i class="level l${e.member.level_info.current_level}"></i></a>`,
            this._createNameplate(e.member.nameplate),
            this._createUserSailing((e.member && e.member.user_sailing) || {}),
            '</div>',
            this._createMsgContent(e),
            '<div class="info">',
            e.floor ? `<span class="floor">#${e.floor}</span>` : '',
            this._createPlatformDom(e.content.plat),
            `<span class="time">${this._formateTime(e.ctime)}</span>`,
            e?.reply_control?.location ? `<span>${e?.reply_control?.location || ''}</span>` : '',
            e.lottery_id ? '' : `<span class="like ${1 === e.action ? 'liked' : ''}"><i></i><span>${e.like || ''}</span></span>`,
            e.lottery_id ? '' : `<span class="hate ${2 === e.action ? 'hated' : ''}"><i></i></span>`,
            e.lottery_id ? '' : this._createReplyBtn(e.rcount),
            (e.lottery_id && e.mid !== this.userStatus.mid) ? '' : `<div class="operation more-operation"><div class="spot"></div><div class="opera-list"><ul>${
              this._canSetTop(e) ? `<li class="set-top">${e.isUpTop ? '取消置顶' : '设为置顶'}</li>` : ''
            }${this._canBlackList(e.mid) ? '<li class="blacklist">加入黑名单</li>' : ''}${
              this._canReport(e.mid) ? '<li class="report">举报</li>' : ''
            }${this._canDel(e.mid) && !e.isTop ? `<li class="del" data-mid="${e.mid}">删除</li>` : ''}</ul></div></div>`,
            this._createLotteryContent(e.content),
            this._createVoteContent(e.content),
            this._createTags(e),
            '</div><div class="reply-box">',
            this._createSubReplyList(e.replies, e.rcount, false, e.rpid, e.folder && e.folder.has_folded),
            '</div><div class="paging-box"></div></div>',
          ].join('')
          return e.state === this.blacklistCode ? r : i
        }
        bbComment.prototype._createSubReplyItem = function (e, n) {
          return [
            `<div class="reply-item reply-wrap" data-id="${e.rpid}" data-index="${n}">`,
            `<a href="//space.bilibili.com/${e.mid}" data-usercard-mid="${e.mid}" target="_blank" class="reply-face">`,
            `<img src="${this._trimHttpFix(this._webpFix(e.member.avatar, { w: 52, h: 52 }))}" alt=""></a>`,
            '<div class="reply-con"><div class="user">',
            `<a href="//space.bilibili.com/${e.mid}" target="_blank" data-usercard-mid="${e.mid}" class="name ${this._createVipClass(e.member.vip.vipType, e.member.vip.vipStatus, e.member.vip.themeType)}">${this._unhtmlFix(e.member.uname)}</a>`,
            `<a class="level-link" href="//www.bilibili.com/blackboard/help.html" target="_blank"><i class="level l${e.member.level_info.current_level}"></i></a>`,
            this._createSubMsgContent(e),
            '</div></div>',
            '<div class="info">',
            `<span class="time">${this._formateTime(e.ctime)}</span>`,
            e?.reply_control?.location ? `<span>${e?.reply_control?.location || ''}</span>` : '',
            `<span class="like ${1 === e.action ? 'liked' : ''}"><i></i><span>${e.like || ''}</span></span>`,
            `<span class="hate ${2 === e.action ? 'hated' : ''}"><i></i></span>`,
            '<span class="reply btn-hover">回复</span>',
            `<div class="operation btn-hover btn-hide-re"><div class="spot"></div><div class="opera-list"><ul>${
              this._canBlackList(e.mid) ? '<li class="blacklist">加入黑名单</li>' : ''
            }${this._canReport(e.mid) ? '<li class="report">举报</li>' : ''}${
              this._canDel(e.mid) ? `<li class="del" data-mid="${e.mid}">删除</li>` : ''
            }</ul></div></div>`,
            '</div></div>',
          ].join('')
        }
      } else {
        bbComment.prototype._createListCon = createListCon
        bbComment.prototype._createSubReplyItem = createSubReplyItem
      }
      oldCommentObserver.disconnect()
    }
  })

  oldCommentObserver.observe(document.head, { childList: true })

  // ==================== 新版评论区处理（fetch/XHR 拦截） ====================

  const patchCommentResponse = (data) => {
    try {
      const json = typeof data === 'string' ? JSON.parse(data) : data
      const replies = [
        ...(json?.data?.replies ?? []),
        ...(json?.data?.top?.upper ? [json.data.top.upper] : []),
        ...(json?.data?.top?.admin ? [json.data.top.admin] : []),
        ...(json?.data?.top?.vote ? [json.data.top.vote] : []),
      ]
      replies.forEach(reply => {
        const allReplies = [reply, ...(reply?.replies ?? [])]
        allReplies.forEach(r => {
          const location = r?.reply_control?.location
          if (!location) return
          setTimeout(() => {
            const rpid = r?.rpid_str ?? String(r?.rpid)
            if (!rpid) return
            const selectors = [
              `[data-id="${rpid}"] .reply-info .reply-time`,
              `[data-id="${rpid}"] .sub-reply-info .sub-reply-time`,
            ]
            for (const sel of selectors) {
              const timeEl = document.querySelector(sel)
              if (timeEl) {
                if (timeEl.querySelector('.ip-location')) {
                  timeEl.querySelector('.ip-location').innerText = location
                } else {
                  const span = document.createElement('span')
                  span.className = 'ip-location'
                  span.style.marginLeft = `${marginLeft}px`
                  span.style.opacity = '0.6'
                  span.innerText = location
                  timeEl.appendChild(span)
                }
                break
              }
            }
          }, 500)
        })
      })
    } catch (e) { /* 忽略非评论接口 */ }
  }

  const origFetch = unsafeWindow.fetch
  unsafeWindow.fetch = function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url ?? ''
    if (url.includes('/x/v2/reply')) {
      return origFetch.apply(this, args).then(async (response) => {
        response.clone().json().then(json => patchCommentResponse(json)).catch(() => {})
        return response
      })
    }
    return origFetch.apply(this, args)
  }

  const origOpen = unsafeWindow.XMLHttpRequest.prototype.open
  unsafeWindow.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (typeof url === 'string' && url.includes('/x/v2/reply')) {
      this.addEventListener('load', function () {
        patchCommentResponse(this.responseText)
      })
    }
    return origOpen.call(this, method, url, ...rest)
  }

})();
