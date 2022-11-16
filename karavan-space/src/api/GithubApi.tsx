import {Octokit} from "octokit";
import {StorageApi} from "./StorageApi";

export interface GithubParams {
    owner: string
    repo: string
    path: string
    branch: string
    name: string
    email: string
    message: string
}

export class GithubApi {

    static async getFile(octokit: Octokit, param: GithubParams) {
        return octokit.request('GET /repos/{owner}/{repo}/contents/{path}{?ref}', {
            owner: param.owner,
            repo: param.repo,
            path: param.path,
            ref: param.branch
        })
    }

    static async pushFile(param: GithubParams, token: string, yaml: string, onSuccess: (result: {}) => void, onError: (reason: {}) => void) {
        const octokit = new Octokit({auth: token});

        let sha = StorageApi.getSessionSha(param);
        console.log("Storage sha", sha)
        if (sha === null || sha === undefined) {
            let file = await GithubApi.getFile(octokit, param);
            sha = file.status === 200 ? (file.data as any).sha : null;
            console.log("Retrieved sha", sha)
        }

        octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner: param.owner,
            repo: param.repo,
            path: param.path,
            message: param.message,
            committer: {
                name: param.name,
                email: param.email
            },
            sha: (sha !== null && sha !== undefined) ? sha : undefined,
            branch: param.branch,
            content: window.btoa(yaml)
        }).then((value: any) => {
            console.log(value);
            console.log(value.data.content.sha);
            if (value.data.content.sha) {
                StorageApi.setSessionSha(param, value.data.content.sha);
            }
            onSuccess(value);
        }).catch(reason => {
            onError(reason)
            StorageApi.setSessionSha(param, undefined);
        })
    }
}
