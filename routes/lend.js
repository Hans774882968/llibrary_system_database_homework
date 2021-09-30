'use strict';
const utils = require('../lib');
const db = require("../coSqlite3");

exports.initDb = function*(req,res){
    yield db.execSQL(`
    create table if not exists book(
        bID VARCHAR(30) PRIMARY KEY not null,
        bName VARCHAR(30),
        bPub VARCHAR(30),
        bDate DATE,
        bAuthor VARCHAR(20),
        bMem VARCHAR(30),
        bCnt INTEGER,
        bTot INTEGER
    )
    `);
    yield db.execSQL(`
    create table if not exists reader(
        rID VARCHAR(8) PRIMARY KEY not null,
        rName VARCHAR(10),
        rSex VARCHAR(8) default '男' check(rSex in ('男','女')),
        rDept VARCHAR(10),
        rGrade INTEGER
    )
    `);
    yield db.execSQL(`
    create table if not exists lend(
        lID INTEGER PRIMARY KEY AUTOINCREMENT not null,
        bID VARCHAR(30) not null,
        rID VARCHAR(8) not null,
        lend_time DATE,
        FOREIGN KEY (bID) REFERENCES book(bID),
        FOREIGN KEY (rID) REFERENCES reader(rID)
    )
    `);
    return "<html><body><div id='result' style='display:none'>0</div>成功</body></html>"
};

exports.overdueBooks = function*(req,res){//TODO：这里的is_overdue可能不合题意
    let bdy = req.body;
    let rID = bdy.rID;
    let rows = yield db.execSQL(`select count(*) as cnt from reader where rID=?`,[rID]);
    if(rows[0].cnt <= 0) return utils.htmlWithState(1,"该证号不存在");
    let tblHTML = "";
    rows = yield db.execSQL(`select lend.bID,bName,lend_time,date(lend_time,'+30 day') as overdue_time from lend,book where rID=? and lend.bID=book.bID`,[rID]);
    for(let row of rows){
        let is_overdue = Date.now() >= Date.parse(row.overdue_time) ? "是" : "否";
        tblHTML += `<tr><td>${row.bID}</td><td>${row.bName}</td><td>${row.lend_time}</td><td>${row.overdue_time}</td><td>${is_overdue}</td></tr>`;
    }
    return utils.qryHTML(tblHTML);
};

exports.lendBook = function*(req,res){//TODO：完善检查
    let bdy = req.body;
    let rID = bdy.rID,bID = bdy.bID;
    //1
    let rows = yield db.execSQL(`select count(*) as cnt from reader where rID=?`,[rID]);
    if(rows[0].cnt <= 0) return utils.htmlWithState(1,"该证号不存在");
    //2
    rows = yield db.execSQL(`select count(*) as cnt from book where bID=?`,[bID]);
    if(rows[0].cnt <= 0) return "<html><body><div id='result' style='display:none'>2</div>该书号不存在</body></html>";
    //3
    rows = yield db.execSQL(`select count(*) as cnt from lend where rID=? and date(lend_time,'+30 day') <= date('now')`,[rID]);
    if(rows[0].cnt > 0) return utils.htmlWithState(3,"该读者有超期书未还");
    //4
    rows = yield db.execSQL(`select count(*) as cnt from lend where rID=? and bID=?`,[rID,bID]);
    if(rows[0].cnt > 0) return utils.htmlWithState(4,"该读者已经借阅该书，且未归还");
    //5
    rows = yield db.execSQL(`select * from book where bID=?`,[bID]);
    if(rows[0].bCnt <= 0) return utils.htmlWithState(5,"该书已经全部借出");
    //插入借书信息
    yield db.execSQL(`insert into lend(bID,rID,lend_time) values(?,?,?)`,[bID,rID,utils.StrTime(new Date(),"yyyy-mm-dd")]);
    yield db.execSQL("update book set bCnt=bCnt-? where bID=?",[1,bID]);
    return utils.htmlWithState(0,"成功");
};

exports.returnBook = function*(req,res){
    let bdy = req.body;
    let rID = bdy.rID,bID = bdy.bID;
    //1
    let rows = yield db.execSQL(`select count(*) as cnt from reader where rID=?`,[rID]);
    if(rows[0].cnt <= 0) return utils.htmlWithState(1,"该证号不存在");
    //2
    rows = yield db.execSQL(`select count(*) as cnt from book where bID=?`,[bID]);
    if(rows[0].cnt <= 0) return "<html><body><div id='result' style='display:none'>2</div>该书号不存在</body></html>";
    //3
    rows = yield db.execSQL(`select count(*) as cnt from lend where rID=? and bID=?`,[rID,bID]);
    if(rows[0].cnt <= 0) return utils.htmlWithState(3,"该读者并未借阅该书");
    //删除借书信息
    yield db.execSQL(`delete from lend where bID=? and rID=?`,[bID,rID]);
    yield db.execSQL("update book set bCnt=bCnt+? where bID=?",[1,bID]);
    return utils.htmlWithState(0,"成功");
};

exports.overdueReaders = function*(req,res){
    let rows = yield db.execSQL(`select distinct reader.rID,rName,rSex,rDept,rGrade from reader,lend where reader.rID=lend.rID and date(lend_time,'+30 day') <= date('now')`);
    let tblHTML = "";
    for(let row of rows){
        tblHTML += `<tr><td>${row.rID}</td><td>${row.rName}</td><td>${row.rSex}</td><td>${row.rDept}</td><td>${row.rGrade}</td></tr>`;
    }
    return utils.qryHTML(tblHTML);
};