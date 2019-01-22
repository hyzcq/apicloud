var $ = {
    appUrl: 'http://192.168.1.3:8360/api',
    /**
     * api对象准备完毕执行函数
     * @param {Function} callback api对象准备完毕后回调
     */
    ready: function(callback) {
        apiready = function() {
            api.parseTapmode();
            // api.addEventListener({
            //     name: 'keyback'
            // }, function(ret, err) {
            //     closeWin()
            // });
            if ($api.dom('header')) {
                $api.dom('header').style.height = 44 + api.safeArea.top + 'px';
                $api.dom('header').style.paddingTop = api.safeArea.top + 'px';
                $api.fixStatusBar($api.dom('header'));
                $api.fixIos7Bar($api.dom('header'));
            }
            callback && callback()
        }
    }
}

function toast(msg) {
    if(typeof msg === 'string'){
        api.toast({
            msg: msg,
            duration: 3000,
            location: 'bottom'
        });
    }else if(typeof msg === 'object'){
        api.toast({
            msg: msg.msg || '',
            duration: msg.duration || 3000,
            location: msg.location || 'bottom'
        });
    }
}

function addEvent(name, cb) {
    api.addEventListener({
        name: name
    }, function(ret, err) {
        cb && cb(ret.value)
    });
}

function sendEvent(name, extra) {
    api.sendEvent({
        name: name,
        extra: extra || {}
    });
}
/**
 * 打开新窗口
 * @param {String} name 打开窗口名及对应url，url与文件名对应
 * @param {Object} pageParam openWin窗口参数
 */
function openWin(name, pageParam, option) {
    var param = pageParam || { pageName: name }, opt = option || {};
    param.pageName = name;
    api.openWin({
        name: name,
        url: 'widget://html/header.html',
        reload: true,
        slidBackEnabled: opt.slidBackEnabled || true,
        slidBackType: opt.slidBackType || 'edge',
        vScrollBarEnabled: opt.vScrollBarEnabled || false,
        hScrollBarEnabled: opt.hScrollBarEnabled || false,
        pageParam: param,
        bounces: opt.bounces || false,  //页面是否弹动。注意如果页面使用了上拉、下拉刷新等功能，该属性可能会被刷新组件重新设置
        singleInstance: opt.singleInstance || false,  //设置该window是否为单例对象。若设置为单例对象，当调用closeWin方法关闭时，window将只是从屏幕移除而不会被销毁，下次再打开时将直接使用已存在的window，而不会再重新创建
        bgColor: opt.bgColor || '',
        delay: opt.delay || 0,
        animation: opt.animation || {
            type: 'movein', //动画类型（详见动画类型常量）
            subType: 'from_right', //动画子类型（详见动画子类型常量）
            duration: 300 //动画过渡时间，默认300毫秒
        }
    });
}

function closeToWin(name) {
    api.closeToWin({
        name: name,
        animation: 'reveal',
        subType: 'from_left',
        duration: 300
    });
}

//关闭新窗口
function closeWin(name) {
    api.closeWin({
        name: name,
        animation: 'push',
        subType: 'from_left',
        duration: 300
    });
}

/**
 * 打开新frame
 * @param {String} name 打开打开新frame名及对应url，url与文件名对应
 * @param {Object} pageParam openFrame窗口参数
 * @param {Boolean} bounces 是否回弹
 */
function openFrame(name, pageParam, option) {
    var y = 0;
    if ($api.dom('header')) {
        $api.fixStatusBar($api.dom('header'));
        $api.fixIos7Bar($api.dom('header'));
        y = $api.dom('header').offsetHeight;
    }
    api.openFrame({
        name: name,
        url: 'widget://html/' + name + '.html',
        pageParam: pageParam,
        rect: option.rect || {
            x: 0,
            y: y,
            w: api.winWidth,
            h: 'auto'
        },
        animation: option.animation || {
            type: api.systemType == 'ios' ? 'movein' : 'none', //动画类型（详见动画类型常量）
            subType: 'from_right', //动画子类型（详见动画子类型常量）
            duration: 300 //动画过渡时间，默认300毫秒
        },
        bounces: option.bounces || false,
        vScrollBarEnabled: option.vScrollBarEnabled || false,
        hScrollBarEnabled: option.hScrollBarEnabled || false,
        allowEdit: option.allowEdit || false,
        reload: option.reload || true
    });
}

function imgOpen(opt) {
    var imageUrls = [];
    if (typeof opt == 'string') {
        imageUrls.push(opt)
    } else {
        imageUrls = opt.imageUrls;
    }
    openWin('img_pop', {
        images: imageUrls,
        opt: opt
    })

}

// 图片选取
function imgChoose(cb, max) {
    var UIMediaScanner = api.require('UIMediaScanner');
    UIMediaScanner.open({
        type: 'picture',
        column: 4,
        classify: true,
        max: max || 6,
        sort: {
            key: 'time',
            order: 'desc'
        },
        texts: {
            stateText: '已选择*项',
            cancelText: '取消',
            finishText: '完成'
        },
        styles: {
            bg: '#fff',
            mark: {
                icon: '',
                position: 'bottom_left',
                size: 20
            },
            nav: {
                bg: '#fff',
                stateColor: '#000',
                stateSize: 16,
                cancelBg: 'rgba(0,0,0,0)',
                cancelColor: '#000',
                cancelSize: 16,
                finishBg: 'rgba(0,0,0,0)',
                finishColor: '#000',
                finishSize: 16
            }
        },
        exchange: true
    }, function(ret) {
        if (ret) {
            if (!ret.list || !ret.list.length) return;
            for (var i = 0; i < ret.list.length; i++) {
                UIMediaScanner.transPath({
                    path: ret.list[i].path
                }, function(trans, err) {
                    if (trans) {
                        imgCompress(trans.path, function(path) {
                            cb && cb(path)
                        })
                    }
                });

            }
        }
    });
}

/**
 * 图片压缩
 * @param {String} path 图片路径
 * @param {Function} callback 图片压缩后回调
 */
function imgCompress(path, callback) {
    showProgress('压缩中...');
    var imageFilter = api.require('imageFilter');
    var theImgName = sha1(path) + '.jpg';
    // var theImgName = md5(path) + GetFileExt(path);
    imageFilter.compress({
        img: path,
        quality: 0.8,
        save: {
            imgPath: 'fs://images',
            imgName: theImgName
        }
    }, function(ret, err) {
        //hideProgress();
        hideProgress()
        if (ret.status) {
            var resultPath = 'fs://images/' + theImgName;
            // imageFilter.getAttr({
            //  path:resultPath
            // },function(ret,err){
            //   alert( JSON.stringify( ret ) );
            // })
            callback(resultPath);
        } else {
            api.toast({
                msg: '压缩失败，请重试！'
            })
        }
    })
}

// 合并对象
function extend(o, n) {
    var obj = n;
    for (var p in o) {
        if (!n.hasOwnProperty(p) && (o.hasOwnProperty(p)))
            obj[p] = o[p];
    }
    return obj;
}

/**
 * 封装api.ajax
 * @param {Object} options ajax参数
 */
function ajax(options) {
    var _default = {
        url: '',
        method: 'get',
        dataType: 'json',
        timeout: 10,
        headers: {
            'Accept': 'application/json'
        }
    };
    var _options = extend(_default, options);
    if (options.headers) {
        _options.headers = extend(options.headers, {
            'appid': api.appId,
            'Accept': 'application/json',

        });
    }
    if (_options.url.lastIndexOf('.json') > -1) {
        _options.method = 'GET';
    }
    if (!_options.url) {
        api.alert({
            msg: '数据地址不正确'
        });
    }
    if (!_options.data) {
        _options.data = {};
    }
    var token = $api.getStorage('token');

    if (token && !_options.disableToken) {
        //console.log(JSON.stringify(_options.headers))
        _options.headers = extend(_options.headers, {
            'Authorization': token.token_type + ' ' + token.access_token
        });
    }
    // if (_options.data.body) {
    // _options.headers = extend(_options.headers, {
    //     'Content-Type': 'application/json'
    // });
    // }
    // if(_options.method=='put'||_options.method=='post'){
    //   _options.headers = extend(_options.headers, {
    //       'Content-Type': 'application/json;charset=utf-8'
    //   });
    // }

    if (!_options.url.match(/^(?:http|ftp|https):\/\//)) {
        //如果传的url含有 http://说明是个绝对路径，就不用拼了
        _options.url = $.appUrl + _options.url;
    }
    api.ajax(JSON.parse(JSON.stringify(_options)), function(ret, err) {
        setTimeout(function() {
            api.hideProgress();
            api.refreshHeaderLoadDone();
        }, 500)

        if (ret && ret.data) {
            _options.success(ret.data);
        } else {
            if (_options.error && typeof(_options.error) === 'function') {
                _options.error(err);
            } else {
                // api.toast({
                //     msg: err.msg,
                //     duration: 2000,
                //     location: 'bottom'
                // });
            }
        }
    });
}

//显示等待模态框
function showProgress(title, text) {
    api.showProgress({
        title: title,
        text: text || '',
        modal: true
    });
}
//关闭模态框
function hideProgress() {
    api.hideProgress();
}

// 上拉加载
function pullUp(callBack) {
    api.addEventListener({
        name: 'scrolltobottom'
    }, function(ret, err) {
        callBack();
    });
};

//下拉刷新
function pullDown(callBack, bgColor) {
    api.setRefreshHeaderInfo({
        bgColor: '#fff',
        textColor: '#545454',
        textDown: '下拉刷新...',
        textUp: '松开刷新...'
    }, function(ret, err) {
        callBack();
    });
};

//是否是空对象
function isEmptyObject(e) {
    var t;
    for (t in e)
        return false;
    return true
}

//时间格式化
Date.prototype.format = function(format) {
    var o = {
        'M+': this.getMonth() + 1, //month
        'd+': this.getDate(), //day
        'h+': this.getHours(), //hour
        'm+': this.getMinutes(), //minute
        's+': this.getSeconds(), //second
        'q+': Math.floor((this.getMonth() + 3) / 3), //quarter
        'S': this.getMilliseconds() //millisecond
    }
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
        (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp('(' + k + ')').test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length == 1 ? o[k] :
                ('00' + o[k]).substr(('' + o[k]).length));
    return format;
}

if (typeof(FastClick) != 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        FastClick.attach(document.body);
    }, false);
}
