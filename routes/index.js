'use strict';
const lend = require('./lend');
const book = require('./book');
const reader = require('./reader');
const app = require('../WebApp');

app.route('/init_db','post',lend.initDb);
app.route('/overdue_books','post',lend.overdueBooks);//未还书籍信息
app.route('/lend_book','post',lend.lendBook);
app.route('/return_book','post',lend.returnBook);
app.route('/overdue_readers','post',lend.overdueReaders);//超期读者列表

app.route('/add_book','post',book.addBook);
app.route('/add_book_num','post',book.addBookNum);
app.route('/dec_book_num','post',book.decBookNum);
app.route('/modify_book_info','post',book.modifyBookInfo);
app.route('/query_book','post',book.queryBook);

app.route('/add_reader','post',reader.addReader);
app.route('/del_reader','post',reader.delReader);
app.route('/modify_reader_info','post',reader.modifyReaderInfo);
app.route('/query_reader','post',reader.queryReader);