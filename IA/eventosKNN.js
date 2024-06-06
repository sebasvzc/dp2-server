const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    host: 'dp2-database.cvezha58bpsj.us-east-1.rds.amazonaws.com',
      port: 3306,
      user: 'administrador',
      password: 'contrasenia',
      database: 'plaza'
      });

const KNNIA = async(req, res,next)=>{

  let connection;

  try{
    connection = await pool.getConnection();
   const [result] = await connection.query(`CALL eventosHistoricosIA()`)
   const [eventosObtenidos] = result;
}catch(error){
   next(error)
}finally {
   if (connection){
       connection.release();
   }
}


}