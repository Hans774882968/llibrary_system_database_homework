'use strict';
const utils = require('../lib');
const db = require("../coSqlite3");

function bookCheck(bID,bName,bPub,bDate,bAuthor,bMem,bCnt){
    if(!bID)
        return {legal: false,msg: utils.htmlWithState(2,"书号[bID]不能为空")};
    if(!bName)
        return {legal: false,msg: utils.htmlWithState(2,"书名[bName]不能为空")};
    if(bID.length > 30)
        return {legal: false,msg: utils.htmlWithState(2,"书号[bID]长度至多为30")};
    if(bName.length > 30)
        return {legal: false,msg: utils.htmlWithState(2,"书名[bName]长度至多为30")};
    if(bPub.length > 30)
        return {legal: false,msg: utils.htmlWithState(2,"出版社[bPub]长度至多为30")};
    let dateFormat = /^(\d{4})-(\d{2})-(\d{2})$/;//日期格式检查
    if(!dateFormat.test(bDate)){
        return {legal: false,msg: utils.htmlWithState(2,"出版日期[bDate]不符合格式要求，应为yyyy-mm-dd")};
    }
    if(bAuthor.length > 20)
        return {legal: false,msg: utils.htmlWithState(2,"作者[bAuthor]长度至多为20")};
    if(bMem.length > 30)
        return {legal: false,msg: utils.htmlWithState(2,"内容摘要[bMem]长度至多为30")};
    bCnt = parseInt(bCnt);
    if(isNaN(bCnt) || bCnt <= 0)
        return {legal: false,msg: utils.htmlWithState(2,"数量[bCnt]应该是正整数")};
    return {legal: true,msg: ""};
}

exports.addBook = function*(req,res){
    let bdy = req.body;
    let bID = bdy.bID,bName = bdy.bName,bPub = bdy.bPub,bDate = bdy.bDate,
        bAuthor = bdy.bAuthor,bMem = bdy.bMem,bCnt = bdy.bCnt;
    let chkObj = bookCheck(bID,bName,bPub,bDate,bAuthor,bMem,bCnt);
    if(!chkObj.legal) return chkObj.msg;
    let rows = yield db.execSQL(`select count(*) as cnt from book where bID=?`,[bID]);
    if(rows[0].cnt > 0) return "<html><body><div id='result' style='display:none'>1</div>该书已经存在</body></html>";
    yield db.execSQL("INSERT INTO book(bID,bName,bPub,bDate,bAuthor,bMem,bCnt,bTot) VALUES(?,?,?,?,?,?,?,?)",[bID,bName,bPub,bDate,bAuthor,bMem,bCnt,bCnt]);
    return "<html><body><div id='result' style='display:none'>0</div>成功</body></html>";
};

exports.addBookNum = function*(req,res){
    let bdy = req.body;
    let bID = bdy.bID,bCnt = bdy.bCnt;
    bCnt = parseInt(bCnt);
    if(isNaN(bCnt) || bCnt <= 0)
        return `<html><body><div id='result' style='display:none'>2</div>提交的参数有误：增加数量[bCnt]应该是正整数</body></html>`;
    let rows = yield db.execSQL(`select count(*) as cnt from book where bID=?`,[bID]);
    if(rows[0].cnt <= 0) return "<html><body><div id='result' style='display:none'>1</div>该书不存在</body></html>";
    yield db.execSQL("update book set bCnt=bCnt+?,bTot=bTot+? where bID=?",[bCnt,bCnt,bID]);
    return "<html><body><div id='result' style='display:none'>0</div>成功</body></html>";
};

exports.decBookNum = function*(req,res){//如果有书借出则不会被删掉
    let bdy = req.body;
    let bID = bdy.bID,bCnt = bdy.bCnt;
    bCnt = parseInt(bCnt);
    if(isNaN(bCnt) || bCnt <= 0)
        return `<html><body><div id='result' style='display:none'>3</div>提交的参数有误：增加数量[bCnt]应该是正整数</body></html>`;
    let rows = yield db.execSQL(`select count(*) as cnt from book where bID=?`,[bID]);
    if(rows[0].cnt <= 0)
        return "<html><body><div id='result' style='display:none'>1</div>该书不存在</body></html>";
    rows = yield db.execSQL(`select * from book where bID=?`,[bID]);
    if(rows[0].bCnt < bCnt){
        return "<html><body><div id='result' style='display:none'>2</div>减少的数量大于该书目前在库数量</body></html>";
    }
    else if(rows[0].bTot === bCnt){//该书总数量被减到零，则表示删除该书
        yield db.execSQL("delete from book where bID=?",[bID]);
    }
    else{
        yield db.execSQL("update book set bCnt=bCnt-?,bTot=bTot-? where bID=?",[bCnt,bCnt,bID]);
    }
    return "<html><body><div id='result' style='display:none'>0</div>成功</body></html>";
};

exports.modifyBookInfo = function*(req,res){
    let bdy = req.body;
    let bID = bdy.bID,bName = bdy.bName,bPub = bdy.bPub,bDate = bdy.bDate,
        bAuthor = bdy.bAuthor,bMem = bdy.bMem;
    let chkObj = bookCheck(bID,bName,bPub,bDate,bAuthor,bMem,1);//没有bCnt
    if(!chkObj.legal) return chkObj.msg;
    let rows = yield db.execSQL(`select count(*) as cnt from book where bID=?`,[bID]);
    if(rows[0].cnt <= 0) return utils.htmlWithState(1,"该书不存在");
    yield db.execSQL("update book set bName=?,bPub=?,bDate=?,bAuthor=?,bMem=? where bID=?",[bName,bPub,bDate,bAuthor,bMem,bID]);
    return utils.htmlWithState(0,"成功");
};

exports.queryBook = function*(req,res){
    let bdy = req.body;
    let bID = bdy.bID,bName = bdy.bName,bPub = bdy.bPub,bDate0 = bdy.bDate0,bDate1 = bdy.bDate1,bAuthor = bdy.bAuthor,bMem = bdy.bMem;
    let sql = "select * from book where 1=1";
    let dat = [];
    if(bID){
        sql += " and bID like '%" + utils.injectionDefense(bID) + "%'";
    }
    if(bName){
        sql += " and bName like '%" + utils.injectionDefense(bName) + "%'";
    }
    if(bPub){
        sql += " and bPub like '%" + utils.injectionDefense(bPub) + "%'";
    }
    if(bDate0){
        sql += " and bDate >= ?";
        dat.push(bDate0);
    }
    if(bDate1){
        sql += " and bDate <= ?";
        dat.push(bDate1);
    }
    if(bAuthor){
        sql += " and bAuthor like '%" + utils.injectionDefense(bAuthor) + "%'";
    }
    if(bMem){
        sql += " and bMem like '%" + utils.injectionDefense(bMem) + "%'";
    }
    let rows = yield db.execSQL(sql,dat);
    let tblHTML = "";
    for(let row of rows){
        tblHTML += `<tr><td>${row.bID}</td><td>${row.bName}</td><td>${row.bTot}</td><td>${row.bCnt}</td><td>${row.bPub}</td><td>${row.bDate}</td><td>${row.bAuthor}</td><td>${row.bMem}</td></tr>`;
    }
    return `
    <html>
        <head>
            <META HTTP-EQUIV="Content-Type" Content="text-html;charset=utf-8">
        </head>
        <body>
            <table border=1 id='result'>${tblHTML}</table>
        </body>
    </html>`;
};