'use strict';
/*global require, module, Buffer, jsGen*/

// rebuild redis cache

var redis = jsGen.lib.redis,
  thenjs = require('thenjs'),
  Thunk = require('thunks')();

module.exports = function (callback) {
  return Thunk(then.series([
    function (cont) {
    redis.userCache.removeAll(function () {
      var users = 0;
      jsGen.dao.user.getUsersIndex(function (err, doc) {
        if (err) {
          cont(err);
        } else if (doc) {
          redis.userCache.update(doc);
          users += 1;
        } else {
          jsGen.config.users = users;
          cont(null, users);
        }
      });
    });
  }, function (cont) {
    redis.tagCache.removeAll(function () {
      var tags = 0;
      jsGen.dao.tag.getTagsIndex(function (err, doc) {
        if (err) {
          cont(err);
        } else if (doc) {
          redis.tagCache.update(doc);
          tags += 1;
        } else {
          cont(null, tags);
        }
      });
    });
  }, function (cont) {
    redis.articleCache.removeAll(function () {
      var total = {
        comments: 0,
        articles: 0
      };

      jsGen.dao.article.getArticlesIndex(function (err, doc) {
        if (err) {
          cont(err);
        } else if (doc) {
          redis.articleCache.update(doc);
          total[doc.status === -1 ? 'comments' : 'articles'] += 1;
        } else {
          jsGen.config.comments = total.comments;
          jsGen.config.articles = total.articles;
          redis.articleCache.clearup();
          cont(null, total.comments + total.articles);
        }
      });
    });
  }]).all(function (cont, error, result) {
    if (!error) {
      console.log('Redis cache rebuild success:', {
        users: result[0],
        tags: result[1],
        articles: result[2]
      });
    }
    callback(error);
  });
};