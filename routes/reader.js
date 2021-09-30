'use strict';
const utils = require('../lib');
const db = require("../coSqlite3");

function readerCheck(rID,rName,rSex,rDept,rGrade){
    if(!rID)
        return {legal: false,msg: utils.htmlWithState(2,"证号[rID]不能为空")};
    if(!rName)
        return {legal: false,msg: utils.htmlWithState(2,"姓名[rName]不能为空")};
    if(!rDept)
        return {legal: false,msg: utils.htmlWithState(2,"系名[rDept]不能为空")};
    if(rID.length > 8)
        return {legal: false,msg: utils.htmlWithState(2,"证号[rID]长度至多为8")};
    if(rName.length > 10)
        return {legal: false,msg: utils.htmlWithState(2,"姓名[rName]长度至多为10")};
    if(rSex !== "男" && rSex !== "女")
        return {legal: false,msg: utils.htmlWithState(2,"性别[rSex]应该填写“男”或者“女”")};
    if(rDept.length > 10)
        return {legal: false,msg: utils.htmlWithState(2,"系名[rDept]长度至多为10")};
    rGrade = parseInt(rGrade);
    if(isNaN(rGrade) || rGrade <= 0)
        return {legal: false,msg: utils.htmlWithState(2,"年级[rGrade]应该是正整数")};
    return {legal: true,msg: ""};
}

exports.addReader = function*(req,res){
    let bdy = req.body;
    let rID = bdy.rID,rName = bdy.rName,rSex = bdy.rSex,
        rDept = bdy.rDept,rGrade = bdy.rGrade;
    let chkObj = readerCheck(rID,rName,rSex,rDept,rGrade);
    if(!chkObj.legal) return chkObj.msg;
    let rows = yield db.execSQL(`select count(*) as cnt from reader where rID=?`,[rID]);
    if(rows[0].cnt > 0) return utils.htmlWithState(1,"该证号已经存在");
    yield db.execSQL("INSERT INTO reader(rID,rName,rSex,rDept,rGrade) VALUES(?,?,?,?,?)",[rID,rName,rSex,rDept,rGrade]);
    return utils.htmlWithState(0,"成功");
};

exports.delReader = function*(req,res){//有书未还都不能删
    let bdy = req.body;
    let rID = bdy.rID;
    //1
    let rows = yield db.execSQL(`select count(*) as cnt from reader where rID=?`,[rID]);
    if(rows[0].cnt <= 0)
        return utils.htmlWithState(1,"该证号不存在");
    //2
    rows = yield db.execSQL(`select count(*) as cnt from lend where rID=?`,[rID]);
    if(rows[0].cnt > 0) return `<html><body><div id='result' style='display:none'>2</div>该读者尚有书籍未归还</body></html>`;
    yield db.execSQL("delete from reader where rID=?",[rID]);
    return utils.htmlWithState(0,"成功");
};

exports.modifyReaderInfo = function*(req,res){
    let bdy = req.body;
    let rID = bdy.rID,rName = bdy.rName,rSex = bdy.rSex,
        rDept = bdy.rDept,rGrade = bdy.rGrade;
    let chkObj = readerCheck(rID,rName,rSex,rDept,rGrade);
    if(!chkObj.legal) return chkObj.msg;
    let rows = yield db.execSQL(`select count(*) as cnt from reader where rID=?`,[rID]);
    if(rows[0].cnt <= 0)
        return utils.htmlWithState(1,"该证号不存在");
    yield db.execSQL("update reader set rName=?,rSex=?,rDept=?,rGrade=? where rID=?",[rName,rSex,rDept,rGrade,rID]);
    return utils.htmlWithState(0,"成功");
};

exports.queryReader = function*(req,res){
    let bdy = req.body;
    let rID = bdy.rID,rName = bdy.rName,rSex = bdy.rSex,
        rDept = bdy.rDept,rGrade0 = bdy.rGrade0,rGrade1 = bdy.rGrade1;
    let sql = "select * from reader where 1=1";
    let dat = [];
    if(rID){
        sql += " and rID like '%" + utils.injectionDefense(rID) + "%'";
    }
    if(rName){
        sql += " and rName like '%" + utils.injectionDefense(rName) + "%'";
    }
    if(rSex){
        sql += " and rSex=?"
        dat.push(rSex);
    }
    if(rDept){
        sql += " and rDept like '%" + utils.injectionDefense(rDept) + "%'";
    }
    if(rGrade0){
        sql += " and rGrade >= ?";
        dat.push(rGrade0);
    }
    if(rGrade1){
        sql += " and rGrade <= ?";
        dat.push(rGrade1);
    }
    let rows = yield db.execSQL(sql,dat);
    let tblHTML = "";
    for(let row of rows){
        tblHTML += `<tr><td>${row.rID}</td><td>${row.rName}</td><td>${row.rSex}</td><td>${row.rDept}</td><td>${row.rGrade}</td></tr>`;
    }
    return utils.qryHTML(tblHTML);
};