// script.js
var domain = 'http://aman7070.com/srv/';

var app = angular.module('app', ['ngRoute', 'ngAnimate']);

app.run(function($http, dataShare) {
    var id = window.localStorage.getItem("id");
    dataShare.set({'id': id});
});

// configure our routes
app.config(function ($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'pages/home.html',
            controller: 'mainController'
        })

        .when('/home', {
            templateUrl: 'pages/home.html',
            controller: 'mainController'
        })

        .when('/login', {
            templateUrl: 'pages/login.html',
            controller: 'loginController'
        })

        .when('/question', {
            templateUrl: 'pages/question.html',
            controller: 'questionController'
        })

        .when('/answer', {
            templateUrl: 'pages/answer.html',
            controller: 'infoController'
        })

        .when('/gameover', {
            templateUrl: 'pages/gameover.html',
            controller: 'infoController'
        })

});

app.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'http://aman7070.com/**'
    ]);
});

app.factory('dataShare', function ($http, $location, $timeout) {
    var service = {};
    var pagePromise = null;
    service.data = null;
    service.settings = null;

    service.set = function (data) {
        this.data = data;
        if (this.data.hasOwnProperty("settings")) this.settings = this.data.settings;
    };
    service.get = function () {
        return this.data;
    };

    service.getSettings = function () {
        return this.settings;
    };

    service.setSettings = function(key1, val1) {
        this.settings[key1] = val1;
    };

    service.dim = window.innerWidth+"*"+window.innerHeight;
    service.width = window.innerWidth;

    service.getZoomFactor = function() {
        return Math.min(window.innerWidth/3.75, window.innerHeight/6.10);
        //return window.innerWidth/3.75;
    };

    service.changePage = function (data, path) {
        this.mainPage = false;
        this.set(data);
        if (path == null) {
            this.mainPage = true;
            if (data.id == -1) path = 'login';
            else if (data.status == 'end') path = 'gameover';
            else path = 'question';
        }
        $location.path(path);
        $timeout.cancel(pagePromise);
        pagePromise = $timeout(function () {
            this.mainPage = false;
            $location.path('home');
        }, 5 * 60 * 1000);
    };

    service.action = function (oper, page, params) {
        params = (params==null)?'':'&'+Object.keys(params).map(function(k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]) }).join('&');
        url = domain + page + '.php?callback=JSON_CALLBACK&id=' + this.get().id + params;
        service.setLoading(true);
        $http.jsonp(url)
        .success(function (data) {
            service.setLoading(false);
            if (oper=='main') service.changePage(data);
            else service.changePage(data, oper);
        })
        .error(function (data) {
            service.setLoading(false);
        });
    };

    var _loading = false;
    var wp = null;
    service.setLoading = function (start) {
        if (start) {
            wp = $timeout(function () {
                _loading = true;
            }, 300);
        }
        else {
            $timeout.cancel(wp);
            _loading = false;
        }
    };

    service.getLoading = function () {
        return _loading;
    };

    return service;
});

app.controller('mainController', function ($scope, $rootScope, $http, $timeout, $interval, dataShare) {
    $scope.dataShare = dataShare;
    $scope.zoomFactor = dataShare.getZoomFactor();

    var timer_cnt = 0;
    timer_start1 = $interval(function () {
        timer_cnt++;
        if (timer_cnt==1) $scope.logo_flip = true;
        else if (timer_cnt==4) $scope.flip = true;
        else if (timer_cnt==6) $scope.home_op1 = true;
        else if (timer_cnt==7) $scope.home_op2 = true;
        else if (timer_cnt==8) $scope.home_op3 = true;
        else $interval.cancel(timer_start1);
    },150);


    $scope.enter = function (admin) {
        dataShare.setLoading(true);
        $http.jsonp(domain + 'question.php?callback=JSON_CALLBACK&id=' + dataShare.get().id)
            .success(function (data) {
                dataShare.setLoading(false);
                dataShare.changePage(data);
            })
            .error(function (data) {
                dataShare.setLoading(false);
            });
    };
});

app.controller('loginController', function ($scope, $http, dataShare) {
    $scope.dataShare = dataShare;
    $scope.loginState = 'code';
    $scope.message = 'הקש את קוד המשתמש לכניסה';
    $scope.value = '';
    $scope.index = 0;
    $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];

    $scope.press = function (val) {
        if (val == 'r') {
            if ($scope.index > 0) {
                $scope.index--;
                $scope.value = $scope.value.slice(0, -1);
            }
            else return;
        }
        else {
            $scope.value += val;
        }

        if ($scope.loginState == 'code') {
            $scope.fills[$scope.index].value = !($scope.fills[$scope.index].value);
        }

        if (val != 'r') $scope.index++;

        if ($scope.loginState == 'code' && $scope.index == 5) {
            dataShare.setLoading(true);
            $http.jsonp(domain+'question.php?callback=JSON_CALLBACK&id=' + $scope.value)
            .success(function (data) {
                dataShare.setLoading(false);
                refresh();
                if (data.id != -1) {
                    window.localStorage.setItem("id", data.id);
                    dataShare.changePage(data);
                }
            });

        } else if ($scope.loginState == 'phone' && $scope.index == 10) {
            dataShare.setLoading(true);
            $http.jsonp(domain+'send_code.php?callback=JSON_CALLBACK&phone=' + $scope.value)
            .success(function (data) {
                dataShare.setLoading(false);
                $scope.sendCodeScreen = true;
            });
        }
    };

    $scope.sendCode = function () {
        refresh();
        $scope.loginState = ($scope.loginState == 'code') ? 'phone' : 'code';
        $scope.message = ($scope.loginState == 'code') ? 'הקש את קוד המשתמש לכניסה' : 'הכנס מספר ווטסאפ למשלוח קוד';
    };

    refresh = function () {
        $scope.value = '';
        $scope.index = 0;
        $scope.fills = [{ value: true }, { value: true }, { value: true }, { value: true }, { value: true }];
    };
});

app.controller('questionController', function ($scope, $http, $location, dataShare, $timeout, $interval) {
    $scope.dataShare = dataShare;
    if (dataShare.get()==null) { $location.path(''); return; }

    $scope.ans_color = ['', '', '', ''];
    $scope.answer_op = 0;
    $scope.score = 60;

    var timer_cnt = 0;
    timer_start = $interval(function () {
        timer_cnt++;
        if (timer_cnt==1) $scope.question_show = true;
        else if (timer_cnt==2) $scope.a1_show = true;
        else if (timer_cnt==3) $scope.a2_show = true;
        else if (timer_cnt==4) $scope.a3_show = true;
        else if (timer_cnt==5) $scope.show_timer = true;
        else if (timer_cnt==6) run();
        else $interval.cancel(timer_start);
    },150);

    var timer;
    var run = function() {
        answer_wait = false;
        timer = $interval(function () {
            $scope.score -= 1;
            if ($scope.score<=0) {
                $scope.answer(4);
            }
        }, 1000);
    };

    var answer_wait = true;
    $scope.answer = function (aid) {
        if (answer_wait) return;
        answer_wait = true;
        $interval.cancel(timer);
        $scope.show_timer = false;
        $scope.answer_op = aid;
        dataShare.setLoading(true);
        $http.jsonp(domain+'answer.php?callback=JSON_CALLBACK&id='+dataShare.get().id+'&score='+$scope.score+'&answer='+aid)
            .success(function (data) {
                $scope.ans_color[aid-1] = (data.result)?'c':'e';
                dataShare.setLoading(false);
                $timeout(function () {
                    dataShare.changePage(data, 'answer');
                }, 1500);
            });
    };
});

app.controller('infoController', function ($scope, $http, $timeout, $location, dataShare) {
    $scope.dataShare = dataShare;
    if (dataShare.get()==null) { $location.path(''); return; }

    $timeout(function () {
        $scope.answer_show = true;
    },100);

    $scope.next_question = function () {
        dataShare.setLoading(true);
        $http.jsonp(domain + 'question.php?callback=JSON_CALLBACK&id=' + dataShare.get().id)
            .success(function (data) {
                dataShare.setLoading(false);
                dataShare.changePage(data);
            })
            .error(function (data) {
                dataShare.setLoading(false);
            });
    };
});