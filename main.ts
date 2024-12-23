import {
    BlobWriter,
    ZipWriter,
} from "https://deno.land/x/zipjs@v2.7.54/index.js";

const zipFileWriter = new BlobWriter();

const zipWriter = new ZipWriter(zipFileWriter);

function recursivePaths(path: string) {
    for (const dirEntry of Deno.readDirSync("src/" + path)) {
        if(dirEntry.isDirectory)
            recursivePaths(path=="" ? dirEntry.name : path + "/" + dirEntry.name)
        else
            zipWriter.add(path=="" ? dirEntry.name : path + "/" + dirEntry.name, Deno.openSync("src/" + path + "/" + dirEntry.name))
    }
}

recursivePaths("")
await zipWriter.close();

try {
    Deno.removeSync("build", { "recursive": true })
} catch (_) { _ }
Deno.mkdirSync("build")

const bytes = await (await zipFileWriter.getData()).bytes()

Deno.serve(((req) => {
    if(new URL(req.url).pathname == "/resource_pack.zip")
        return new Response(bytes)
    return new Response("Not Found", { status: 404, statusText: "Not Found" })
}))