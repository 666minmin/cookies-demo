var http = require('http')
var fs = require('fs')
var md5=require('md5')
let sessions={}

http.createServer(function(request, response){
   
    var path = request.url 
    var method = request.method
    if(path=="/"){
        let cookies=null==request.headers.cookie?null:request.headers.cookie.split(";")
        cookies=request.headers.cookie.split(";")
        let hash={}
        for(let i=0;i<cookies.length;i++){
            let parts=cookies[i].split("=")
            let key=parts[0]
            let value=parts[1]
            hash[key]=value
        }
        response.statusCode=200
        //if(null!=cookies && cookies.length>0){
        if(null!=sessions[hash.sessionId]){        
            var string=fs.readFileSync("./main.html",'utf8')
            //string=string.replace('__username__',hash.username)
            string=string.replace('__username__',sessions[hash.sessionId].username)

        }else{
            var string=fs.readFileSync("./login.html",'utf8')           
        }
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.write(string)
        response.end()
    }else if(path=="/login"&& method.toUpperCase()==='GET'){
        response.statusCode=200
        var string=fs.readFileSync("./login.html",'utf8')
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.write(string)
        response.end()

    }else if(path=="/login"&& method.toUpperCase()==='POST'){
        readyBody(request).then((body)=>{
            let strings=body.split("&")
            let hash={}
            strings.forEach(string => {
                let parts=string.split("=")
                let key=parts[0]
                let value=parts[1]
                hash[key]=value
            });
            let {username,password}=hash
            if(""==username){
                response.statusCode=400
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.write(`{
                    "errors":{
                        "username":"请输入正确用户名"
                    }
                }`)
             
            }else if(""==password){
                response.statusCode=400
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.write(`{
                    "errors":{
                        "password":"请输入正确密码"
                    }
                }`)
 
            }else{
                let users=fs.readFileSync('./db/users.txt','utf8')
                users=""==users?[]:JSON.parse(users)
                let isvalidate=false;
                for(let i=0;i<users.length;i++){
                    if(users[i].username===username && users[i].password===password){
                        isvalidate=true;
                        break;
                    }
                 }
                if(isvalidate){
                    response.statusCode=200
                    let sessionId=Math.random()*100000
                    sessions[sessionId]={username:username}
                    response.setHeader('Set-Cookie',`sessionId=${sessionId}`);
                    response.setHeader('Content-Type', 'application/json; charset=utf-8')
                    response.write(`{
                        "success":true
                    }`)

                }else{
                    response.statusCode=401
                    response.setHeader('Content-Type', 'application/json; charset=utf-8')
                    response.write(`{
                        "errors":{
                            "msg":"账户不存在"
                        }
                    }`)
                }
            
            
          
            }
            response.end()
         })

    }else if(path=="/main"){
        
        let string=fs.readFileSync("./main.html",'utf8')
        let fileMd5=md5(string)
        if(request.headers['if-none-match']===fileMd5){
            response.statusCode=304;
        }else{
            response.statusCode=200
            response.setHeader('ETag',fileMd5)
        }
       
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        let cookies=request.headers.cookie.split(";")
        let hash={}
        for(let i=0;i<cookies.length;i++){
            let parts=cookies[i].split("=")
            let key=parts[0]
            let value=parts[1]
            hash[key]=value
        }
       // string=string.replace('__username__',hash.username)
       if(null!=sessions[hash.sessionId]){
         string=string.replace('__username__',sessions[hash.sessionId].username)  
       }
        response.write(string)
        response.end()
    }else if(path=="/register" && method.toUpperCase()==='GET'){
        response.statusCode=200
        var string=fs.readFileSync("./register.html",'utf8')
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.write(string)
        response.end()

    }else if(path=="/register" && method.toUpperCase()==='POST'){
        readyBody(request).then((body)=>{
           let strings=body.split("&")
           let hash={}
           strings.forEach(string => {
               let parts=string.split("=")
               let key=parts[0]
               let value=parts[1]
               hash[key]=value
           });
           let {username,password,confirm_password}=hash
           if(""==username){
            response.statusCode=400
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.write(`{
                "errors":{
                    "username":"请输入正确用户名"
                }
            }`)
            
           }else if(""==password){
            response.statusCode=400
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.write(`{
                "errors":{
                    "password":"请输入正确密码"
                }
            }`)

           }else if(""==confirm_password || password!==confirm_password){
            response.statusCode=400
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.write(`{
                "errors":{
                    "confirm_password":"请输入正确确认密码"
                }
            }`)

           }else{
            response.statusCode=200
            let users=fs.readFileSync('./db/users.txt','utf8')
            users=""==users?[]:JSON.parse(users)
            let isvalidate=true;
            for(let i=0;i<users.length;i++){
                if(users[i].username===username){
                    isvalidate=false;
                    break;
                }
            }
            if(isvalidate){
                users.push({username:username,password:password})  
                fs.writeFileSync('./db/users.txt',  JSON.stringify(users))
            }else{
                response.statusCode=400
                response.setHeader('Content-Type', 'application/json; charset=utf-8')
                response.write(`{
                    "errors":{
                        "msg":"account is exit"
                    }
                }`)
            }
           
           }
           response.end()
        })

    }else{
        response.statusCode=400
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.write(`
        {
            "error":"not found"
        }
        `)
        response.end()

    }
}).listen(8080)

function readyBody(request){
    return new Promise((resolve,reject)=>{
      let body=[]
      request.on('data',(chunk)=>{
          body.push(chunk)
      }).on("end",()=>{
          body=Buffer.concat(body).toString();
          resolve(body)
      })
    });

}
function getCookies(){
    let cookies=request.headers.cookie.split(";")
    let hash={}
    for(let i=0;i<cookies.length;i++){
        let parts=cookies[i].split("=")
        let key=parts[0]
        let value=parts[1]
        hash[key]=value
    }
    return hash;
}
