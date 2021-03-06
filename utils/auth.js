const WXAPI = require('apifm-wxapi')
const UBT = require('ubt.js')


async function checkSession() {
  return new Promise((resolve, reject) => {
    wx.checkSession({
      success() {
        return resolve(true)
      },
      fail() {
        return resolve(false)
      }
    })
  })
}

// 检测登录状态，返回 true / false
async function checkHasLogined() {
  const token = wx.getStorageSync('token')
  if (!token) {
    return false
  }
  const loggined = await checkSession()
  if (!loggined) {
    wx.removeStorageSync('token')
    return false
  }
  const checkTokenRes = await WXAPI.checkToken(token)
  if (checkTokenRes.code != 0) {
    wx.removeStorageSync('token')
    return false
  }
  return true
}

/* 查询用户注册码是否绑定 */
async function getIsRegistryCode() {
  const registerCode = wx.getStorageSync('uid'),
    data = await UBT.getUidRegistryByUid(registerCode);
  return data == null ? false : true;
}

async function wxaCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        return resolve(res.code)
      },
      fail() {
        wx.showToast({
          title: '获取code失败',
          icon: 'none'
        })
        return resolve('获取code失败')
      }
    })
  })
}

async function getUserInfo() {
  return new Promise((resolve, reject) => {
    wx.getUserInfo({
      success: res => {
        return resolve(res)
      },
      fail: err => {
        console.log(err)
        return resolve()
      }
    })
  })
}

async function login(page) {
  const _this = this;
  wx.login({
    success: function (res) {
      WXAPI.login_wx(res.code).then(function (res) {
        // if (res.code == 10000) {
        // 去注册
        //_this.register(page)
        // return;
        // }
        // if (res.code != 0) {
        //   // 登录错误
        //   wx.showModal({
        //     title: '无法登录',
        //     content: res.msg,
        //     showCancel: false
        //   })
        //   // return;
        // }
        wx.setStorageSync('uid', res.data.uid);
        wx.setStorageSync('token', res.data.token);
        // checkUbtAccount(page);
        if (page) {
          page.onShow()
        }
      })
    }
  })
}

// async function checkUbtAccount(page) {
//   var uid = wx.getStorageSync('uid');
//   UBT.checkUser(uid).then(function (res) {
//     if (res == null) {
//       wx.showModal({
//         title: '帐号未开通',
//         content: '请联系管理员为您的微信(ID:' + uid + ')开通帐号',
//         showCancel: false,
//         success(res) {
//           if (res.confirm) {
//             wx.switchTab({
//               url: "/pages/my/index"
//             })
//           } else {
//             wx.navigateBack()
//           }
//         }
//       })
//       loginOut();
//     } else {
//       if (page) {
//         page.onShow()
//       }
//     }

//   }, function (fail) {
//     console.error(err)

//   })
// }

async function register(page) {
  let _this = this;
  wx.login({
    success: function (res) {
      let code = res.code; // 微信登录接口返回的 code 参数，下面注册接口需要用到
      wx.getUserInfo({
        success: function (res) {
          let iv = res.iv;
          let encryptedData = res.encryptedData;
          let referrer = '' // 推荐人
          let referrer_storge = wx.getStorageSync('referrer');
          if (referrer_storge) {
            referrer = referrer_storge;
          }
          // 下面开始调用注册接口
          WXAPI.register_complex({
            code: code,
            encryptedData: encryptedData,
            iv: iv,
            referrer: referrer
          }).then(function (res) {
            _this.login(page);

          })
        }
      })
    }
  })
}

function loginOut() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('uid')
}

async function checkAndAuthorize(scope) {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success(res) {
        if (!res.authSetting[scope]) {
          wx.authorize({
            scope: scope,
            success() {
              resolve() // 无返回参数
            },
            fail(e) {
              console.error(e)
              // if (e.errMsg.indexof('auth deny') != -1) {
              //   wx.showToast({
              //     title: e.errMsg,
              //     icon: 'none'
              //   })
              // }
              wx.showModal({
                title: '无权操作',
                content: '需要获得您的授权',
                showCancel: false,
                confirmText: '立即授权',
                confirmColor: '#e64340',
                success(res) {
                  wx.openSetting();
                },
                fail(e) {
                  console.error(e)
                  reject(e)
                },
              })
            }
          })
        } else {
          resolve() // 无返回参数
        }
      },
      fail(e) {
        console.error(e)
        reject(e)
      }
    })
  })
}


module.exports = {
  checkHasLogined: checkHasLogined,
  wxaCode: wxaCode,
  getUserInfo: getUserInfo,
  login: login,
  register: register,
  loginOut: loginOut,
  checkAndAuthorize: checkAndAuthorize,
  getIsRegistryCode: getIsRegistryCode
}