import app from "./src/app.js";
// import { prisma } from "./src/lib/prisma.js";
import {env} from  "./src/config/env.js";

// async function start()
// {
//     try
//     {
//         await prisma.$connect();
//         console.log("Prisma is connected");

//         app.listen(env.PORT,()=>{
//             console.log(`server is running on port ${env.PORT}`);

//         })

//     }
//     catch(error)
//     {
//         console.error("Error Starting the server");
//         console.error(error);
//         process.exit(1);
//     }
// }
// start();

app.listen(env.PORT, () => console.log(`Server on port ${env.PORT}`));
