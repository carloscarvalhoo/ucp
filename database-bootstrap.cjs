const fs=require('fs'),path=require('path'),crypto=require('crypto');
const mysql=require('mysql2/promise');
(async()=>{
  const root=__dirname,envFile=path.join(root,'.env.local');
  const prior=fs.existsSync(envFile)?fs.readFileSync(envFile,'utf8'):'';
  if(/MYSQL_PASSWORD=/.test(prior))throw Error('Database already configured; bootstrap will not replace credentials.');
  const connection=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:'',multipleStatements:false});
  const appPassword=crypto.randomBytes(32).toString('hex'),rootPassword=crypto.randomBytes(32).toString('hex');
  try{
    await connection.query('CREATE DATABASE IF NOT EXISTS ucp_site CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    await connection.query("CREATE USER IF NOT EXISTS 'ucp_app'@'localhost' IDENTIFIED BY ?",[appPassword]);
    await connection.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ucp_site.* TO 'ucp_app'@'localhost'");
    await connection.query('USE ucp_site');
    const schema=fs.readFileSync(path.join(root,'database/schema.sql'),'utf8');
    for(const statement of schema.split(/;\s*(?:\r?\n|$)/).map(s=>s.trim()).filter(Boolean))await connection.query(statement);
    fs.mkdirSync(path.join(root,'.cms-private'),{recursive:true});
    fs.writeFileSync(path.join(root,'.cms-private/mysql-root.env'),'MYSQL_ROOT_PASSWORD='+rootPassword+'\n');
    fs.writeFileSync(envFile,prior+'\nMYSQL_HOST=127.0.0.1\nMYSQL_PORT=3307\nMYSQL_DATABASE=ucp_site\nMYSQL_USER=ucp_app\nMYSQL_PASSWORD='+appPassword+'\n');
    await connection.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?",[rootPassword]);
    console.log('Created ucp_site with application account; credentials saved privately.');
  }finally{await connection.end();}
})().catch(e=>{console.error(e.code||e.message);process.exitCode=1});
