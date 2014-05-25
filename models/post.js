var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, title, post) {
  this.name = name;
  this.title = title;
  this.post = post;
};

module.exports = Post;

// 存储文章信息
Post.prototype.save = function(callback) {
  // 
  var date = new Date();
  var time = {
    date: date,
    year: date.getFullYear(),
    month: date.getFullYear() + "-" + (date.getMonth() + 1),
    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + 
           " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
  }
  var post = {
  	name: this.name,
    time: time,
  	title: this.title,
  	post: this.post,
    // 留言
    comments: []
  }

  mongodb.open(function (err, db) {
    if (err) {
	    return callback(err);
	  }

	  // 读取posts集合
	  db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      // 将文档插入posts集合
      collection.insert(post, {
          safe: true
      }, function (err, post) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
  	  });
    });
  });
};

//读取文档信息
Post.getTen = function(name, page, callback) {
  console.log('20140506 Post.getTen');

  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    };

    // 读取posts集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
	    }

      var query = {};
      if (name) {
        query.name = name;
      };

      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (page - 1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function (err, docs){
          mongodb.close();
          if (err) {
            return callback(err);
          };

          //解析 markdown 为 html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });
          console.log('20140506 callback before ');
          callback(null, docs, total);
        });
      });
    });
  });
};

//获取一篇文章
Post.getOne = function(name, day, title, callback) {
  // 打开数据库
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    };

    // 读取posts集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      // 根据用户名发表日期以及文章标题进行查询
      collection.findOne({
        "name": name, 
        "time.day": day,
        "title": title
      }, function (err, doc){
        mongodb.close();
        if (err) {
          return callback(err);
        };

        //解析 markdown 为 html
        if (doc) {
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });
        };
        callback(null, doc);
      });
    });
  });
};

//返回原始发表的内容（markdown形式）
Post.edit = function(name, day, title, callback) {
  // 打开数据库
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    };

    // 读取posts集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      // 根据用户名发表日期以及文章标题进行查询
      collection.findOne({
        "name": name, 
        "time.day": day,
        "title": title
      }, function (err, doc){
        mongodb.close();
        if (err) {
          return callback(err);
        };

        //解析 markdown 为 html
        //doc.post = markdown.toHTML(doc.post);
        callback(null, doc);
      });
    });
  });
};

//更新一篇文章以及相关信息
Post.update = function(name, day, title, post, callback) {
  // 打开数据库
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    };

    // 读取posts集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      // 根据用户名发表日期以及文章标题进行查询
      collection.update({
        "name": name, 
        "time.day": day,
        "title": title
      }, {
        $set: {post: post}
      }, function (err, doc){
        mongodb.close();
        if (err) {
          return callback(err);
        };

        callback(null);
      });
    });
  });
};

//删除一篇文章以及相关信息
Post.remove = function(name, day, title, callback) {
  // 打开数据库
  mongodb.open(function(err, db) {
    if (err) {
      return callback(err);
    };

    // 读取posts集合
    db.collection('posts', function(err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }

      // 根据用户名发表日期以及文章标题删除一篇文章
      collection.remove({
        "name": name, 
        "time.day": day,
        "title": title
      }, {
        w: 1
      }, function (err, doc){
        mongodb.close();
        if (err) {
          return callback(err);
        };
        callback(null);
      });
    });
  });
};