## Iceberg Visualization Project
### Project Description
This is an iceberg visualization project built with data from [BYU iceberg database]((https://www.scp.byu.edu/current_icebergs.html)), aiming to facilitate research and usage of iceberg data. The main features of this project are: 
1. A **robust backend**, cleaning and organizing data from original BYU database, initializing the backend database with both static file data and dynamic web data.
2. **Visualizations in the frontend**. Multiple interactive graphs are created to display iceberg locations, number changes and movement patterns. 
The project is built in a modular way, when extending this project for your own need, you only have to add new pages under `client/src/pages/` directory, and add the corresponding component to `Routes.tsx`.
Pages      | Visualization                                                                  
------------ | ------------ 
**Prim Visualization** | ![Prim Visualization](images/prim算法运行过程.png)
**Kruskal Visualization** | ![Kruskal Visualization](images/kruskal算法运行过程.png)
**Dijkstra Visualization** | ![Dijkstra Visualization](images/dijkstra算法运行过程.png)
**Floyd Visualization** | ![Floyd Visualization](images/Floyd算法过程.png)
**Metro Lines** | ![Metro Lines](images/上海地铁线路图.png)
**Transfer Routes** | ![Transfer Routes](images/换乘路线图.png)

### Dependencies
- frontend: `React+Vite+Typescript`, to setup relating packages, use:
```bash
cd client
npm i
```

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