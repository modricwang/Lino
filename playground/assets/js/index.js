/*var title_2 = new Vue({
 el: '#title_2',
 data:{
 title: 'This is a new one!'
 }
 });*/
/*jshint multistr: true */
//TODO: change serverurl and hide it during deployment
var serverurl = "https://lino.yi-ru.wang/api/v1";
var testlive = "./lives/live.html?lid=";
$(document).ready(function () {
    // if($.cookie("Login_Success")==null)
    //TODO:记得改回来...现在是为了方便调试.....   
    //  if($.cookie("Login_Success")!=null){
    //      $.alert('登录失效,请重新登录', '遇到问题辣%>_<%!', function () {
    //         window.location.href="Login.html";
    //     });
    // };
    if (LiveList == null || LiveList.$data.Live_Item_List.length == 0)
        $.showPreloader("请稍等一下下%>_<%\n点击可以关闭我哦");
});

Vue.component('live_item', {
    props: ['live'], //title,begin_time,description
    methods: {
        OnListItemClick: function (item) {
            //alert("WTF");
            window.location.href = item.href;
        },
        OnLikeClick: function (item) {
            if($("#like" + item.lid).text() == "赞") {
                $.ajax({
                    url: serverurl + "/lives/" + item.lid +"/like",
                    type: 'PUT',
                    xhrFields: {
                        withCredentials: true
                    }
                });
                $.alert('点赞成功');
                item.likeamount++;
                $("#like" + item.lid).text("取消赞");
            }
            else {
                $.ajax({
                    url: serverurl + "/lives/" + item.lid +"/like",
                    type: 'DELETE',
                    xhrFields: {
                        withCredentials: true
                    },
                });
                $.alert('取消赞成功');
                item.likeamount--;
                $("#like" + item.lid).text("赞");
            }

        }
    },
    template: '                             \
    <div class="card demo-card-header-pic" >\
     <div valign="bottom" class="card-header color-white no-border no-padding" v-on:click="OnListItemClick(live)">\
              <img class="card-cover" :src="live.coverpath" alt="">\
              </div>\
        <div style="background-image:url()" valign="bottom" class="card-header color-white no-border" v-on:click="OnListItemClick(live)">\
            {{live.title}}\
        </div>\
        <div class="card-content" v-on:click="OnListItemClick(live)">\
            <div class="card-content-inner" >\
                <p class="color-gray">开始于{{live.begin_time}}</p>\
                <p>持续时间为{{live.last_time}}分钟</p>\
                <p>{{live.description}}</p>\
            </div>\
        </div>\
        <div class="card-footer">\
        <div>\
            <div style="display:inline-block"> \
            <a href="#" class="likes" v-on:click="OnLikeClick(live)" :id="\'like\' + live.lid">赞</a>\
            </div>\
            <div style="display:inline-block"> \
            <p>{{live.likeamount}}</p>\
            </div>\
            </div>\
            <a href="#" class="link" onclick="$.toast(\'感谢您的反馈\')">举报</a>\
        </div>\
    </div>'
});

Vue.component('user_item', {
    props: ['user'], //nickname
    methods: {
        OnListItemClick: function (item) {
            //alert("WTF");
            window.location.href = item.href;
        }
    },
    template: '\
    <div class="card" v-on:click="OnListItemClick(user)">\
    <div class="card-content">\
    <div class="card-content-inner">\
    <p>用户:{{user.nickname}}</p>\
    </div>\
    </div>\
    </div>'
});

var LiveList = new Vue({
    el: '#Live_List',
    data: {
        Live_Item_List: [],
        latest: 0
    },
    methods: {
        Init: function () {
            $.ajax({
                type: 'GET',
                url: serverurl + "/lives?host=0&upcoming=1&from=0",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data, status) {
                    var isLogined = localStorage.uid!=undefined;
                    result = JSON.parse(data);
                    var likes=[];
                    $.each(result.lives, function (index, item) {
                        likes[index]=getlike(serverurl + "/lives/" + item.lid + "/like")
                    });
                    $.each(result.lives, function (index, item) {
                        LiveList.$data.Live_Item_List.push({
                            lid: item.lid,
                            title: item.name,
                            begin_time: new Date(item.begin_time).toLocaleString(),
                            description: item.description,
                            last_time: item.duration / 60000,
                            //coverpath: "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1496073561214&di=b31cb40ac5e96a0169d6a21a86e1cd83&imgtype=0&src=http%3A%2F%2Fngnews.7xz.com%2Fuploadfile%2F2016%2F0629%2F20160629092602704.jpg",
                            coverpath: getCover(item.cover),
                            //likeamount: getlike(serverurl + "/lives/" + item.lid + "/like"),
                            likeamount: likes[index],
                            href: isLogined?"./lives/live.html?lid=" + item.lid:"./login.html"
                        });
                    });
                    LiveList.$data.latest = result.lives.length;

                },
                complete: function() {
                    $.hidePreloader();
                }

            });
        }
    },
    created: function () {
        if (typeof(localStorage.uid) !== "undefined") {
            $.ajax(
                {
                    type: 'POST',
                    xhrFields: {
                        withCredentials: true
                    },
                    url: serverurl + "/users/auth",
                    data: JSON.stringify({
                        "authinfo": {
                            "mail": localStorage.email,
                            "hashedPassword": $.sha256(localStorage.email + localStorage.password + "Lino")
                        }
                    }),
                    success: function (data, status) {
                        $("#panel-left").remove();
                    },
                    error: function (data, status) {
                        $.toast("出于安全考虑，请重新登录");
                        Logout();
                    }
                }
            );
        }
        else {
            $("#panel-logged").remove();
            $("#nav-me").remove();
            $("#logout-btn").remove();
        }
        this.Init();
    }
});

function postRawFile() {
    //this function does an HTTP POST to the remote URL with the raw content as the body
    //file      :   File object, usually obtained in the way like $('#fileinput').files[0]
    //settings  :   jQuery XHR settings object, refer to https://api.jquery.com/jquery.ajax/#jQuery-ajax-settings for more information.
    //              Attention that this function overwrites type, contentType, data and processData in settings
    var reader = new FileReader();
    var files = $('input[name="file"]').prop('files');
    reader.onload = function () {
        $.ajax({
            type: 'POST',
            xhrFields: {
                withCredentials: true
            },
            contentType: 'application/octet-stream',
            processData: false,
            url: serverurl + "/files",
            data: new Uint8Array(this.result),
            success: function (data, status) {
                pic = JSON.parse(data);
                var others = JSON.parse(localStorage.others);
                $.ajax({
                    url: serverurl + "/users/" + localStorage.uid,
                    type: 'PUT',
                    data: JSON.stringify({
                        "user": {
                            "uid": localStorage.uid,
                            "nickname": localStorage.nickname,
                            "others": {
                                "description": others.description,
                                "sex": others.sex,
                                "avatar": pic.file.fid
                            }
                        },
                        "password": $.sha256(localStorage.email + localStorage.password + "Lino")
                    }),
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function (data, status) {
                        $("#avatar-panel").attr('src', serverurl + "/files/" + pic.file.fid);
                        $("#avatar-page").attr('src', serverurl + "/files/" + pic.file.fid);
                        $.alert('设置完成');
                    },
                    error: function (data, status) {
                        $.toast('发生了' + data.status + '错误');
                    }
                });
            },
            error: function (data, status) {
                $.toast('发生了' + data.status + '错误');
            }
        });
    };
    reader.readAsArrayBuffer(files[0]);
}

function getlike(likeurl) {
    var result = 0;
    $.ajax({
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        async:false,
        url: likeurl,
        success: function (data, status) {
            result = JSON.parse(data).likes;
        }
    });
    return result;
}
var PersonalPageLiveList = new Vue({
    el: '#PersonalPage_Live_List',
    data: {
        Live_Item_List: [],
        latest: 0
    },
    methods: {

        Init: function () {
            $.ajax({
                type: 'GET',
                url: serverurl + "/lives?host=" + localStorage.uid + "&upcoming=0&from=0",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data, status) {
                    result = JSON.parse(data);
                    $.each(result.lives, function (index, item) {

                        PersonalPageLiveList.$data.Live_Item_List.push({
                            title: item.name,
                            begin_time: new Date(item.begin_time).toLocaleString(),
                            description: item.description,
                            last_time: formatSeconds(item.time_lasted),
                            //coverpath: "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1496073561214&di=b31cb40ac5e96a0169d6a21a86e1cd83&imgtype=0&src=http%3A%2F%2Fngnews.7xz.com%2Fuploadfile%2F2016%2F0629%2F20160629092602704.jpg",
                            coverpath: getCover(item.cover),
                            likeamount: getlike(serverurl + "/lives/" + item.lid + "/like"),
                            href: "./lives/live.html?lid=" + item.lid
                        });
                    });
                    PersonalPageLiveList.$data.latest = result.lives.length;
                    $.hidePreloader();
                }
            });
        }
    },
    created: function () {
        this.Init();

    }
})
var SearchLiveList = new Vue({
    el: '#Search_Live_List',
    data: {
        Live_Item_List: [],
        latest: 0

    }
});

var UserList = new Vue({
    el: '#user_list',
    data: {
        User_List: []
    }
});

function Like() {
    //title_2.title='Thank you!';
    alert('Thank you!');
}

function Logout() {
    localStorage.clear();
    var keys = document.cookie.match(/[^ =;]+(?=\=)/g);
    if (keys) {
        for (var i = keys.length; i--;)
            document.cookie = keys[i] + '=0;expires=' + new Date(0).toUTCString()
    }
    $.ajax(
        {
            type: 'DELETE',
            xhrFields: {
                withCredentials: true
            },
            url: serverurl + "/users/auth",
            success: function (data, status) {
                window.location.href = "index.html";
            },
            error: function (data, status) {
                $.toast('发生了' + data.status + '错误');
            }
        }
    );
}

function Contact() {
    window.open('tencent://message/?uin=419811184');
    window.open('mqqwpa://im/chat?chat_type=wpa&uin=419811184&version=1');
    window.open('mqq://im/chat?chat_type=wpa&uin=419811184&version=1&src_type=web');
}

function formatSeconds(value) {
    var theTime = parseInt(value); // 秒
    var theTime1 = 0; // 分
    var theTime2 = 0; // 小时
    if (theTime > 60) {
        theTime1 = parseInt(theTime / 60);
        theTime = parseInt(theTime % 60);
        if (theTime1 > 60) {
            theTime2 = parseInt(theTime1 / 60);
            theTime1 = parseInt(theTime1 % 60);
        }
    }
    var result = "" + parseInt(theTime) + "秒";
    if (theTime1 > 0) {
        result = "" + parseInt(theTime1) + "分" + result;
    }
    if (theTime2 > 0) {
        result = "" + parseInt(theTime2) + "小时" + result;
    }
    return result;
}

function getCover(fid) {
    return serverurl + "/files/" + fid;
}
var PersonalPage = new Vue({
    el: "#PersonalPageStatus",
    data: {
        //TODO : databind（wait for backend interface）
        focus: 2,
        fans: 2,
        LiveAmount: 2,
        nickname: "",
        personalDescription: "",
        sex: ""
    },
    methods: {},
    created: function () {
        $.ajax({
            type: "GET",
            xhrFields: {
                withCredentials: true
            },
            datatype: "json",
            url: serverurl + "/users/me",
            success: function (data, status) {
                //alert(data.user.uid);
                list = JSON.parse(data);
                localStorage.uid = list.user.uid;
                localStorage.nickname = list.user.nickname;
                PersonalPage.$data.nickname = list.user.nickname;

                // alert(list.user.others);
                // alert(JSON.stringify(list.user.others));
                // alert(JSON.parse(list.user.others).sex);
                others = list.user.others;
                $("#avatar-panel").attr('src', serverurl + "/files/" + others.avatar);
                $("#avatar-page").attr('src', serverurl + "/files/" + others.avatar);
                PersonalPage.$data.personalDescription = others.description;
                PersonalPage.$data.sex = others.sex;
            }

        });
    }
})

var PersonalPanel = new Vue({
    el: "#panel-logged",
    data: {
        nickname: "",
        personalDescription: "",
        sex: ""
    },
    methods: {},
    created: function () {
        $.ajax({
            type: "GET",
            xhrFields: {
                withCredentials: true
            },
            url: serverurl + "/users/me",
            success: function (data, status) {
                list = JSON.parse(data);
                PersonalPanel.$data.nickname = list.user.nickname;
                PersonalPage.$data.personalDescription = list.user.others.description;
            }

        });
    }
})

var PersonalConfig = new Vue({
    el: "#popup-personalconfig",
    data: {
        nickname: localStorage.nickname,
        password: localStorage.password,
        password_again: localStorage.password,
        description: PersonalPage.$data.personalDescription,
        sex: PersonalPage.$data.sex
    },
    created: function () {
        // PersonalConfig.$data.nickname="123";
        //$("#newnickname").val(nickname);
        // alert(localStorage.nickname);
        // alert(localStorage.password);

        // $("#newnickname").val(localStorage.nickname);
        // $("#newpassword").val(localStorage.password);
        //  $("#newpassword_again").val(localStorage.password);
        //  $("#newsex_selection").val(PersonalPage.$data.sex);
        //  $("#newdescription").val(PersonalPage.$data.personalDescription);
    },
    updated: function () {
        // PersonalConfig.$data.nickname="123";
        // $("#newnickname").val(localStorage.nickname);
        //                 $("#newpassword").val(localStorage.password);
        //                  $("#newpassword_again").val(localStorage.password);
        //                  $("#newsex_selection").val(PersonalPage.$data.sex);
        //                  $("#newdescription").val(PersonalPage.$data.personalDescription);
    },
    mounted: function () {
        // PersonalConfig.$data.nickname="123";
    }

});

function SubmitExpiration() {
    var expiration = $("#expiration").val();
    var now = new Date();
    now.setTime(now.getTime() + expiration * 24 * 3600 * 1000);
    document.cookie = "expires=" + now.toUTCString();
    setTimeout("localStorage.clear();", now.getTime());
}

function submitPersonalInfoChange() {
    newnickname = $("#newnickname").val();
    description = $("#newdescription").val();
    password = $("#newpassword").val();
    password_again = $("#newpassword_again").val();
    sex = $("#newsex_selection").val();

    if (password != password_again) {
        $.alert("两次输入的密码不一致！");
        return;
    } else {
        alert(password);
        // alert(password);
        PersonalPage.$data.nickname = newnickname;
        PersonalPage.$data.personalDescription = description;

        $.ajax({
            url: serverurl + "/users/" + localStorage.uid,
            type: 'PUT',
            data: JSON.stringify({
                "user": {
                    "uid": localStorage.uid,
                    "nickname": newnickname,
                    "others": {
                        "description": description,
                        "sex": sex,
                        "avatar" : localStorage.avatar
                    }
                },
                "password": $.sha256(localStorage.email + password + "Lino")
            }),
            xhrFields: {
                withCredentials: true
            },
            success: function (data, status) {
                $.alert("修改成功");
                localStorage.password = password;
                localStorage.nickname = nickname;
            }
        });
    }

}

function startSearch() {
    name = $("#search").val();
    $("#live-list-title").text("直播:");
    $("#user-list-title").text("用户:");
    $.ajax({
        url: serverurl + "/lives?name=" + name + "&upcoming=0&from=0&host=0",
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function (data, status) {
            a = JSON.parse(data);
            list = a.lives;
            result = JSON.parse(data);
            SearchLiveList.$data.Live_Item_List = [];
            $.each(result.lives, function (index, item) {

                SearchLiveList.$data.Live_Item_List.push({
                    title: item.name,
                    begin_time: new Date(item.begin_time).toLocaleString(),
                    description: item.description,
                    last_time: formatSeconds(item.time_lasted),
                    //coverpath: "https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1496073561214&di=b31cb40ac5e96a0169d6a21a86e1cd83&imgtype=0&src=http%3A%2F%2Fngnews.7xz.com%2Fuploadfile%2F2016%2F0629%2F20160629092602704.jpg",
                    coverpath: getCover(item.cover),
                    likeamount: serverurl + "/lives/" + item.lid + "/like",
                    href: "./lives/live.html?lid=" + item.lid
                });
            });
            SearchLiveList.$data.latest = result.lives.length;

        }
    });
    $.ajax({
        url: serverurl + "/users?nickname=" + name + "&from=0",
        type: 'GET',
        xhrFields: {
            withCredentials: true
        },
        success: function (data, status) {
            a = JSON.parse(data);
            list = a.users;
            result = JSON.parse(data);
            UserList.$data.User_List = [];
            $.each(result.users, function (index, item) {
                UserList.$data.User_List.push({
                    nickname:item.nickname,
                    href: "./space.html?uid=" + item.uid
                });
            });
        }
    });

}

function checkit(isChecked) {
    if (isChecked)
        $(document.body)['addClass']('theme-dark');
    else
        $(document.body)['removeClass']('theme-dark');
}

function retrievePassword() {
    var mail = $("#mail-re").val();
    localStorage.email = mail;
    $.showPreloader('正在执行查询...');
    $.ajax({
        url: serverurl + "/users/forgot",
        type: 'POST',
        data: JSON.stringify({
                "mail": mail
            }
        ),
        xhrFields: {
            withCredentials: true
        },
        success: function (data, status) {
            $.hidePreloader();
            $.alert("已发送邮件");
        },
        error: function (data, status) {
            $.hidePreloader();
            $.alert("请检查您的输入" + data.status);
        }
    });
}