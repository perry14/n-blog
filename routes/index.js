
/*
 * GET home page.
 */
var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var Comment = require('../models/comment.js');
var fs = require('fs');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

module.exports = function(app){
  app.get('/', function (req, res) {
  	// 判断是否第一页，并把请求的页数转化成Number类型。
  	var page = req.qurey.p ? parseInt(req.qurey.p) : 1;
  	//var page = 1;
  	// 查询并返回第page页的10篇文章。
  	Post.getTen(null, page, function (err, posts, total) {
  	  if (err) {
  	  	posts = {};
  	  };
  	  res.render('index', {
  	    title: '主页',
        posts: posts,
        page: page,
        isFirstPage: (page - 1) == 0,
        isLastPage: ((page - 1) * 10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
  	  });
  	})

  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function (req, res) {
  	console.log('reg get');
  	res.render('reg', {
  	  title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  	});
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function (req, res) {
  	//res.render('reg', {title: '主页'});
  	console.log('reg post');

  	var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //
    console.log('password_re' + password_re);
    console.log('password' + password);

    if (password_re != password) {
      req.flash('error', '两次输入的密码不一致');
      return res.redirect('/reg');
    };
    var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: req.body.name,
        password: password,
        email: req.body.email
    });
    User.get(newUser.name, function (err, user) {
      if (user) {
        req.flash('error', '该用户已存在');
        return res.redirect('/reg');
      };
      newUser.save(function (err, user) {
      	if (err) {
      	  req.flash('error', err);
          return res.redirect('/reg');
      	};
      	req.session.user = user;
      	req.flash('success', '注册成功');
      	res.redirect('/');
      });
    });
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
  	console.log('login get');
  	res.render('login', {
  	  title: '登陆',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  	});
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
  	//res.render('login', {title: '登陆'});
  	console.log('login post');

  	var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    // 检查用户是否已经存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '该用户不存在');
        return res.redirect('/login');
      };
      // 检查密码是否正确
      if (user.password != password) {
      	req.flash('error', '密码错误');
      	return res.redirect('/login');
      };
      // 将用户信息存入session
      req.session.user = user;
      req.flash('success', '登陆成功！');
      res.redirect('/');
    });
  });

  app.get('/post', checkLogin);
  app.get('/post', function (req, res) {
  	//res.render('post', {title: '发表'});
  	res.render('post', {
  	  title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  	});
  });

  app.post('/post', checkLogin);
  app.post('/post', function (req, res) {
  	//res.render('post', {title: '发表'});
  	var currentUser = req.session.user,
  	  post = new Post(currentUser.name, req.body.title, req.body.post);
  	post.save(function (err){
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      };
      req.flash('success', '发布成功');
      res.redirect('/');
  	});
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function (req, res) {
  	//res.render('post', {title: '发表'});
  	req.session.user = null;
  	req.flash('success', '登出成功!');
  	res.redirect('/');
  });

  function checkLogin (req, res, next) {
  	if (!req.session.user) {
      req.flash('error', '未登录');
      res.redirect('/login');
  	}
  	next();
  }

  function checkNotLogin (req, res, next) {
  	if (req.session.user) {
      req.flash('error', '已登录');
      res.redirect('back');
  	}
  	next();
  }

  app.get('/upload', checkLogin);
  app.get('/upload', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('upload get');

  	res.render('upload', {
  	  title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  	});
  });

  app.post('/upload', checkLogin);
  app.post('/upload', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 upload post');

  	for (var i in req.files) {
  	  if (req.files[i].size == 0 ) {
        fs.unlinkSync(req.files[i].path);
        console.log('successly removed an empty file');
  	  } else {
        var target_path = './public/images/' + req.files[i].name;
        console.log('20140506 upload post' + target_path);
        fs.renameSync(req.files[i].path, target_path);
        console.log('successly renamed a file');
  	  };
  	};
  	req.flash('success', '上传成功');
    res.redirect('/upload');
  });

  // 
  //app.get('/u/:name', checkLogin);
  app.get('/u/:name', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 upload post');

  	var page = req.qurey.q ? parseInt(req.qurey.q) : 1;

    User.getTen(req.params.name, page, function (err, user) {
      if (!user) {
  	    req.flash('error', '用户不存在');
        res.redirect('/');
      }
      // 
      Post.getAll(user.name, function (err, posts) {
      	if (err) {
  	      req.flash('error', err);
          res.redirect('/');
        }
        res.render('user', {
          title: user.name,
          posts: posts,
          page: page,
          isFirstPage: (page - 1) == 0,
          isLastPage: ((page - 1) * 10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });

  app.get('/u/:name/:day/:title', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 upload post');
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
  	    req.flash('error', err);
        res.redirect('/');
      }
      // 
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  // 
  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 get /edit/:name/:day/:title');
  	var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
      if (err) {
  	    req.flash('error', err);
  	    // res.redirect('back');
        return res.redirect('back');
      }
      // 
      res.render('edit', {
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  // 修改文章
  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 post /edit/:name/:day/:title');
  	var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
      var url = '/u/' + currentUser.name + '/' + req.params.day  + '/' + req.params.title;
      if (err) {
  	    req.flash('error', err);
  	    // res.redirect('back');
        return res.redirect(url);
      }
  	  req.flash('success', '修改成功！');
      res.redirect(url);
    });
  });

  // 删除文章
  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 get /remove/:name/:day/:title');
  	var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
      if (err) {
  	    req.flash('error', err);
  	    // res.redirect('back');
        return res.redirect('back');
      }
  	  req.flash('success', '删除成功！');
      res.redirect('/');
    });
  });

  // 增加留言
  app.post('/u/:name/:day/:title', function (req, res) {
  	//res.render('post', {title: '发表'});
  	console.log('20140506 get /remove/:name/:day/:title');

  	var date = new Date();
  	var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + 
           " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
      name: req.body.name,
      email: req.body.email,
      website: req.body.website,
      time: time,
      content: req.body.content
    }

  	var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
  	    req.flash('error', err);
  	    // res.redirect('back');
        return res.redirect('back');
      }
  	  req.flash('success', '留言成功！');
      res.redirect('back');
    });
  });
};