export class GeneratorApi {

    static async generate(filename: string, data: string) {
        const response = await fetch("https://kameleon.dev/generator/openapi?filename="+ filename, {
            method: 'POST',
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': filename.endsWith("json") ? 'application/json' : 'application/yaml'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: data
        });
        return response.text();
    }

}
