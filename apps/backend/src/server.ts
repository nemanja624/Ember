import "dotenv/config";
import { app }  from "./app.js";

 const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});