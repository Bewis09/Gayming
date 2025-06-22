import { BlobWriter, ZipWriter } from "zip";

async function toZip() {
    const zipFileWriter = new BlobWriter();

    const zipWriter = new ZipWriter(zipFileWriter);

    function recursivePaths(path: string) {
        for (const dirEntry of Deno.readDirSync("src/" + path)) {
            if (dirEntry.isDirectory) {
                recursivePaths(
                    path == "" ? dirEntry.name : path + "/" + dirEntry.name,
                );
            } else {
                zipWriter.add(
                    path == "" ? dirEntry.name : path + "/" + dirEntry.name,
                    Deno.openSync("src/" + path + "/" + dirEntry.name),
                );
            }
        }
    }

    recursivePaths("");
    await zipWriter.close();

    return await (await zipFileWriter.getData()).bytes();
}

// deno-lint-ignore no-explicit-any
let bytes: any | undefined = undefined;

let html: string | undefined = undefined;

Deno.serve(async (req) => {
    if (new URL(req.url).pathname == "/resource_pack.zip") {
        if (bytes === undefined) {
            bytes = await toZip();
        }

        return new Response(bytes);
    }
    if (new URL(req.url).pathname.match(/^\/rules\/?$/)) {
        if (html === undefined || true) {
            html = Deno.readTextFileSync("index.html").replace("rule_server_insert_here", Deno.readTextFileSync("rules/rules.md"));
        }

        return new Response(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    }
    return new Response("Not Found", { status: 404, statusText: "Not Found" });
});
