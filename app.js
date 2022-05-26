import express from "express";
import path from "path";
import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken'
import goods from "./data/goods.json";
//import cart from "./data/cart.json";
import menus from './data/menus.json'
import users from './data/users.json'
import userInfo from './data/userInfo.json'
import channels from './data/channels.json'
import articles from './data/articles.json'
import allChannels  from './data/allChannels.json'
import defaultChannels from './data/defaultChannels.json'
import comments from './data/comments.json'
import multiparty  from "multiparty"; // 文件上传
// 改造写文件方法
const writeFile = promisify(fs.writeFile);

// 创建网站服务器实例对象
const app = express();
// 支持跨域访问
app.use(cors());
// 配置静态资源访问目录
app.use(express.static(path.join(__dirname, "public")));
// 处理格式为application/x-www-form-urlencoded的请求参数
app.use(bodyParser.urlencoded({ extended: false }));
// 处理格式为application/json的请求参数
app.use(bodyParser.json());


  // 所有的api的请求都要求登陆后才能获取到对应的数据(注意：这里放的位置)
//app.use('/goods', (req, res, next) => {
    // 如果请求的是登录的接口地址，不进行判断。
	//console.log('path==',req.path)
 // if(req.path==='/user/login'){
  //  return next();
 // }
  //jwt.verify(req.get('Authorization'),'my_token',function(err,decode){
   // if(err){
     // res.status(401).jsonp({
       // code: 8,
      //  msg: '用户没有登录，不能访问!!'
     // });
    //}else{
   //   next();
  //  }
 // })
//})

app.get('/',(req,res)=>{
	
})

//获取商品数据(未分页)
app.get("/products", (req, res) => {
  res.send(goods);
});


// 获取商品列表
app.get("/goods", (req, res) => {
  let { pageNumber, pageSize, search } = req.query;
  if(!pageSize) pageSize=3;
  if(!pageNumber) pageNumber=1;
  let newGoods=[];
   if (search !== undefined && search!=='') {
    for (let i = 0; i < goods.length; i++) {
      if (goods[i].title.indexOf(search) >= 0) {
        newGoods.push(goods[i]);
      }
    }
    //if (pageNumber > newGoods.length) {
      //pageNumber = newGoods.length;
    //}
	if(pageNumber>Math.ceil(newGoods.length/pageSize)){
		pageNumber=Math.ceil(newGoods.length/pageSize)
	}
    if (pageNumber < 1) {
      pageNumber = 1;
    }
	
    let arr = newGoods.slice(pageSize * (pageNumber - 1), pageSize * pageNumber); 
    const result = { "list": arr, "totalCount": newGoods.length, "currentPage": pageNumber };
    res.send(result);
  } else {
	if(pageNumber>Math.ceil(goods.length/pageSize)){
		pageNumber=Math.ceil(goods.length/pageSize)
	}
    newGoods = goods.slice(pageSize * (pageNumber-1), pageSize*pageNumber);
    const result = { "list": newGoods, "totalCount": goods.length, "currentPage": pageNumber };
    res.send(result);
  }
 
});
//添加商品
app.post('/goods/add', async(req, res) => {
  let body = req.body;
  const id = goods[goods.length - 1].id+1;
  //模拟商品的编号
  body.id = id;
  goods.push(body)
  await writeFile("./data/goods.json", JSON.stringify(goods));
  res.send(body)
})
//完成商品的编辑
app.post('/goods/edit', async (req, res) => {
  let body = req.body;
  const goodsProduct = goods.find((item) => item.id == body.goodsId);
  if (!goodsProduct) res.status(400).send({ msg: "商品不存在" });
  goodsProduct.title = body.title;
  goodsProduct.price = body.price;
  goodsProduct.thumbnail = body.thumbnail;
  goodsProduct.goodsDetail = body.goodsDetail;
  await writeFile("./data/goods.json", JSON.stringify(goods));
  res.send(goodsProduct)
})

 //删除商品
 app.delete('/goods/delete', async(req, res) => {
   
  const { id } = req.query;
  if (!id) return res.status(400).send({ msg: "商品id不存在" });
  // 查找要删除的购物车中的商品的索引
  const index = goods.findIndex((item) => item.id == id);
  // 删除商品
  let result = goods.splice(index, 1);
  // 如果删除失败
  if (result.length == 0) return res.status(400).send({ msg: "商品删除失败" });
  // 存储结果
  await writeFile("./data/goods.json", JSON.stringify(goods));
  // 响应
  res.send({ msg: "商品删除成功",index:index,code:'ok'});
 })


//上传图片文件
app.post('/goods/fileUpload',  (req, res) => {
  //进行文件上传。
  var form = new multiparty.Form();
  /* 设置编辑 */
  form.encoding = 'utf-8';
  //设置文件存储路劲
  form.uploadDir = '../shoppingCartService/public/images';
  // console.log("dir", form.uploadDir);
  //设置文件大小限制
  form.maxFilesSize = 2 * 1024 * 1024;
  // 上传后处理
  form.parse(req, function(err, fields, files) {
      //console.log('fields', fields); // 提交过来的表单的信息，包括了了表单元素的name属性的值，请求的方式。
      if (err) {
          console.log('parse error:' + err);
      } else {
          var uploadedPath = files.file[0].path;
          // console.log('uploadedPath===',uploadedPath);
          var newfileName = new Date().getMilliseconds() + path.extname(uploadedPath);
          if (path.extname(uploadedPath) == ".jpg" ||path.extname(uploadedPath) == ".png"|| path.extname(uploadedPath) == ".gif") {
              var dstPath = '../shoppingCartService/public/images/' + newfileName;
              // //重命名为真实文件名
              fs.rename(uploadedPath, dstPath, function(err) {
                  if (err) {
                      res.send({ msg: '文件重命名失败', flag: 'no' });
                  } else {

                     //这里只返回该路径就可以了，因为在app.js文件中已经对静态文件进行了
                          // 配置
                      res.send({ msg: '/images/'+ newfileName, flag: 'ok' });
                  }
              })
          } else {
              //不是图片文件，将其删除掉。
              fs.unlink(uploadedPath, function(err) {
                  if (err) {
                      console.log(err)
                  }
              })
              res.send({ msg: '文件只能上传图片', flag: 'no' });
          }
      }

  })
})

//查询某个具体商品信息
app.get('/goods/get', (req, res) => {
  const { goodsId } = req.query;
  if (!goodsId) return res.status(400).send({ msg: "商品id不存在" });
  const goodsProduct = goods.find((item) => item.id == goodsId);
  if (!goodsProduct) res.status(400).send({ msg: "商品不存在" });
  res.send(goodsProduct)
})
//获取菜单数据
app.get('/menus',(req,res)=>{
	res.send(menus);
})

//用户登录
app.post('/user/login',(req,res)=>{
		const {userName,userPwd}=req.body;
	const userInfo=users.find((item)=>item.userName===userName && item.userPwd===userPwd);
	
	if(userInfo!==undefined){
		const token=jwt.sign({
			name:userInfo.userName,
			date:Date.now()
		},'my_token')
	return res.json({code:0,data:userInfo,msg:"登录成功",myToken:token})		
		
	}
	return res.json({code:1,msg:'登录失败，用户名或密码错误!!'})
	
})

// 获取用户列表
app.get("/users", (req, res) => {
  let { pageNumber, pageSize, search } = req.query;
  if(!pageSize) pageSize=3;
  if(!pageNumber) pageNumber=1;
  let newUsers=[];
   if (search !== undefined && search!=='') {
    for (let i = 0; i < users.length; i++) {
      if (users[i].userName.indexOf(search) >= 0) {
        newUsers.push(users[i]);
      }
    }
    if (pageNumber > newUsers.length) {
      pageNumber = newUsers.length;
    }
    if (pageNumber < 1) {
      pageNumber = 1;
    }
	
    let arr = newUsers.slice(pageSize * (pageNumber - 1), pageSize * pageNumber); 
    const result = { "list": arr, "totalCount": newUsers.length, "currentPage": pageNumber };
    res.send(result);
  } else {
    newUsers = users.slice(pageSize * (pageNumber-1), pageSize*pageNumber);
    const result = { "list": newUsers, "totalCount": users.length, "currentPage": pageNumber };
    res.send(result);
  }
 
});

//添加用户信息
app.post('/users/add',async(req,res)=>{
	let body = req.body;
  const id = users[users.length - 1].id+1;
  //模拟商品的编号
  body.id = id;
  users.push(body)
  await writeFile("./data/users.json", JSON.stringify(users));
  res.send(body)
})
//查询某个具体用户信息
app.get('/users/get', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send({ msg: "用户id不存在" });
  const userInfo = users.find((item) => item.id == userId);
  if (!userInfo) res.status(400).send({ msg: "用户不存在" });
  res.send(userInfo)
})

//完成用户的编辑
app.post('/users/edit', async (req, res) => {
  let body = req.body;
  const userInfo = users.find((item) => item.id == body.id);
  if (!userInfo) res.status(400).send({ msg: "用户不存在" });
  userInfo.userName = body.userName;
  userInfo.userPwd = body.userPwd;
  userInfo.userMail = body.userMail;
  await writeFile("./data/users.json", JSON.stringify(users));
  res.send(userInfo)
})
// 删除用户信息
app.delete('/user/delete',async(req,res)=>{
	const { id } = req.query;
  if (!id) return res.status(400).send({ msg: "用户id不存在" });
  // 查找要删除的购物车中的商品的索引
  const index = users.findIndex((item) => item.id == id);
  // 删除商品
  let result = users.splice(index, 1);
  // 如果删除失败
  if (result.length == 0) return res.status(400).send({ msg: "用户删除失败" });
  // 存储结果
  await writeFile("./data/users.json", JSON.stringify(users));
  // 响应
  res.send({ msg: "用户删除成功",index:index,code:'ok'});
})

//查询完整用户信息
app.get('/userInfo/get', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send({ msg: "用户id不存在" });
  const user = userInfo.find((item) => item.id == userId);
  if (!user) res.status(400).send({ msg: "用户不存在" });
  res.send(user)
})
//获取用户默认频道数据
app.get('/user/channels',(req,res)=>{
	//res.send(channels);
	res.send(defaultChannels)
})
//获取所有频道数据
app.get('/channels',(req,res)=>{
	res.send(allChannels)
})

//添加用户频道
app.post('/user/addChannels',async(req,res)=>{
	 const { userId,channel } = req.body;
	 const content={userId,...channel}
	 channels.push(content)
	  await writeFile("./data/channels.json", JSON.stringify(channels));
  res.send(content)
})
//删除用户指定的频道
app.delete('/user/channels',async(req,res)=>{
	const { channelId,userId } = req.query
	// 查找要删除频道数据
  const index = channels.findIndex((item) => item.id == channelId && item.userId == userId);
  console.log('index=',index)
  // 删除商品
  let result = channels.splice(index, 1);
  // 如果删除失败
  if (result.length == 0) return res.status(400).send({ msg: "频道删除失败" });
  // 存储结果
  await writeFile("./data/channels.json", JSON.stringify(channels));
  // 响应
  res.send({ msg: "用户删除成功",index:index,code:'ok'});
})

//获取登录用户对应的频道列表数据
app.get('/user/currentChannels',(req,res)=>{
	const {userId } = req.query
	const result = channels.map(item =>{
		if(item.userId === parseInt(userId)){
			return item
		}
	})
	res.send(result)
})



// 获取文章列表数据
app.get('/articles',(req,res)=>{
	let { pageNumber, channel_id,referrer } = req.query;
		console.log('channel_id=',channel_id);
	let pageSize = 6;
 // if(!pageNumber) pageNumber=1;

    let news=[];
	if(referrer){
		for(var i=0;i<6;i++){
			news.push(
				{"id":articles.length+1,"title":"boxuegu"+parseInt(Math.random()*100+600),"content":"推荐1111111","photo":"/images/805.jpg","cId":1}
			)
		}
	   
   }
	for(let i = 0;i<articles.length;i++){
		if(articles[i].cId===parseInt(channel_id)){
			news.push(articles[i])
		}
	}
  
  
    let arr = news.slice(pageSize * (pageNumber-1), pageSize*pageNumber);
	
    const result = { "list": arr, "totalCount": arr.length, "p_num": parseInt(pageNumber)+1 };
	//res.send(result);
	setTimeout(()=>{
		res.send(result);
	},2000)
    
  
})
// 获取联想建议的数据
app.get('/suggestion',(req,res)=>{
	
	let {q} = req.query;
	let news=[];
	for(let i=0;i<articles.length;i++){
		if(articles[i].title.search(q.toUpperCase())!=-1){
			news.push(articles[i].title)
		}
	}
	const result={"list":news}
	res.send(result);
})


// 获取搜索数据
app.get('/search',(req,res)=>{
	let { pageNumber,q } = req.query;
	let pageSize = 6;
	
 // if(!pageNumber) pageNumber=1;

    let news=[];
	console.log('q=',q)
	for(let i = 0;i<articles.length;i++){
		if(articles[i].title.toUpperCase().indexOf(q.toUpperCase()) >= 0 ){
			news.push(articles[i])
		}
	}


    let arr = news.slice(pageSize * (pageNumber-1), pageSize*pageNumber);
	    
	
    const result = { "list": arr, "totalCount": arr.length, "p_num": parseInt(pageNumber)+1 };
	setTimeout(()=>{
		res.send(result);
	},2000)
	// res.send(result)
})

//根据文章编号，获取文章详情
app.get('/articles/get',(req,res)=>{
	let  { articleId }=req.query;
	if (!articleId) return res.status(400).send({ msg: "文章id不存在" });
  const articeInfo = articles.find((item) => item.id == articleId);
  if (!articeInfo) res.status(404).send({ msg: "文章不存在" });
  res.send(articeInfo)
	
})
// 取消用户关注：
app.delete('/user/followings',async(req,res)=>{
	let { followId }=req.query
	//aut_id
	 const articeInfo = articles.find((item) => item.aut_id == followId);
	 articeInfo.is_followed=false
	  await writeFile("./data/articles.json", JSON.stringify(articles));
	  res.send({code:'ok'})
	
})
//添加关注用户
app.post('/user/followings',async(req,res)=>{
	 const body = req.body;
	 const  followId = body.followId
	  const articeInfo = articles.find((item) => item.aut_id == followId);
	 articeInfo.is_followed=true
	  await writeFile("./data/articles.json", JSON.stringify(articles));
	   res.send({code:'ok'})
})

//添加文章收藏
app.post('/articles/collections',async(req,res)=>{
	const body = req.body;
	const articleId=body.articleId
	const articeInfo = articles.find((item) => item.id == articleId);
	articeInfo.is_collected=true
	await writeFile("./data/articles.json", JSON.stringify(articles));
	const user = userInfo.find((item)=>item.id===1)
	user.art_collection.push(articleId)
	user.follow_count = user.art_collection.length
	await writeFile("./data/userInfo.json", JSON.stringify(userInfo));
	   res.send({code:'ok'})
})
//取消收藏
app.delete('/articles/deleteCollection',async(req,res)=>{
		let { articleId } = req.body
		const articeInfo = articles.find((item) => item.id == articleId);
		articeInfo.is_collected=false 
	await writeFile("./data/articles.json", JSON.stringify(articles));
	const user = userInfo.find((item)=>item.id===1)
	const index = user.art_collection.indexOf(articleId)
	user.art_collection.splice(index,1)
	user.follow_count = user.art_collection.length
	await writeFile("./data/userInfo.json", JSON.stringify(userInfo));
	   res.send({code:'ok'})
})
//实现文章点赞
app.post('/articles/likings',async(req,res)=>{
	const body = req.body;
	const articleId=body.articleId
	const articeInfo = articles.find((item) => item.id == articleId);
	articeInfo.is_liked=true
	await writeFile("./data/articles.json", JSON.stringify(articles));
	const user = userInfo.find((item)=>item.id===1)
	user.like_collection.push(articleId)
	user.like_count = user.like_collection.length
	await writeFile("./data/userInfo.json", JSON.stringify(userInfo));
	   res.send({code:'ok'})
})
//取消点赞
app.delete('/articles/deleteLikings',async(req,res)=>{
	let { articleId } = req.body
		const articeInfo = articles.find((item) => item.id == articleId);
		articeInfo.is_liked=false 
		await writeFile("./data/articles.json", JSON.stringify(articles));
		const user = userInfo.find((item)=>item.id===1)
	const index = user.like_collection.indexOf(articleId)
	user.like_collection.splice(index,1)
	user.like_count = user.like_collection.length
	await writeFile("./data/userInfo.json", JSON.stringify(userInfo));
	   res.send({code:'ok'})
})
//获取文章的评论
app.get('/comments',(req,res)=>{
	let  { type,source,pageIndex,pageSize } = req.query;
	let  arr=[];
	if(type==='a'){
		for(var i=0;i<comments.length;i++){
		  if(comments[i].articleId===parseInt(source) && comments[i].parentId===0){
		    arr.push(comments[i])
			
		  }
		}
		
	}else{
	   for(var i=0;i<comments.length;i++){
		  if(comments[i].parentId===parseInt(source)){
		    arr.push(comments[i])
				console.log('b')
		  }
		}
	
		console.log('arr=',arr)
	}
	
    let newArr = arr.slice(pageSize * (pageIndex-1), pageSize*pageIndex);
	    

    const result = { "list": newArr, "totalCount": newArr.length, "p_num": parseInt(pageIndex)+1,'commentsCount':arr.length };
	setTimeout(()=>{
		res.send(result);
	},2000)
})
//实现评论的点赞
app.post('/comment/likings',async(req,res)=>{
	const {commentId} = req.body;
	const commentInfo = comments.find((item) => item.id == commentId);
	commentInfo.is_liking = true;
	commentInfo.like_count += 1
		await writeFile("./data/comments.json", JSON.stringify(comments));
	   res.send({code:'ok'})
	
	
})
//取消评论点赞
app.delete('/comment/deleteLikings',async(req,res)=>{
	const {commentId} = req.body;
	const commentInfo = comments.find((item) => item.id == commentId);
	commentInfo.is_liking = false;
	commentInfo.like_count -= 1
		await writeFile("./data/comments.json", JSON.stringify(comments));
	   res.send({code:'ok'})
})
// 对文章进行评论
app.post('/comments',async(req,res)=>{
	const {target,content,typeData } = req.body;
	const commentInfo = {};
	if(typeData==="article"){	 
	  commentInfo.articleId = target;
	  commentInfo.parentId = 0;	  
	}else{
		commentInfo.articleId = 0;
	  commentInfo.parentId = target;	  
	}
	 commentInfo.content = content;
	 commentInfo.aut_photo="/images/805.jpg"
	  commentInfo.aut_name = "wangwu"
	  commentInfo.like_count = 0;
	  commentInfo.pubdate = "2021-07-06T23:59:52";
	  commentInfo.reply_count = 0;
	  commentInfo.is_liking = false;
	  
	  const id = comments[comments.length - 1].id+1;
  //模拟商品的编号
  commentInfo.id = id;
  comments.push(commentInfo)
  await writeFile("./data/comments.json", JSON.stringify(comments));
  res.send(commentInfo)
})

// 监听端口
app.listen(3005);
