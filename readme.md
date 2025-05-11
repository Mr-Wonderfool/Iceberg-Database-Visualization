### 项目依赖
- 前端：`React+Vite+Typescript`，安装相关依赖：
```bash
cd client
npm i
```
- 后端：`Flask`
```bash
cd ../server
pip install flask flask_cors flask_sqlalchemy
pip install flask_jwt_extended # json web token
cd ..
pip install -e .
```

### 项目运行
- 分别启动后端和前端：
```bash
cd server
python app.py
cd ../client
npm run dev
```
之后在`localhost:5173`端口可以查看网页。
- 数据库初始化时生成了一个管理员用户，用户名`root`，密码`111`(记录在`server/config.py`中)，可以直接登录，拥有数据库最高操作权限，例如删除用户的评论。
- 第一次运行时，会在`src/server/instance`文件夹下生成`db.sqlite`。

### 数据来源
- 数据集来源于[NASA SCP](https://www.scp.byu.edu/current_icebergs.html)，利用`beautifulsoup4`库，对网页数据进行了爬取

### 作者
2251804 徐志铭