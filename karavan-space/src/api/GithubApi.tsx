import {Octokit} from "octokit";
import {StorageApi} from "./StorageApi";
import Authenticator from "netlify-auth-providers";

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
        if (sha === null || sha === undefined) {
            let file = await GithubApi.getFile(octokit, param);
            sha = file.status === 200 ? (file.data as any).sha : null;
        }

        octokit.rest.repos.createOrUpdateFileContents({
            owner: param.owner,
            repo: param.repo,
            path: param.path,
            message: param.message,
            committer: {
                name: param.name,
                email: param.email
            },
            sha: (sha !== null) ? sha : undefined,
            branch: param.branch,
            content: window.btoa(yaml)
        }).then((value: any) => {
            if (value.data.content.sha) {
                StorageApi.setSessionSha(param, value.data.content.sha);
            }
            onSuccess(value);
        }).catch(reason => {
            console.log("Error", reason);
            onError(reason)
            StorageApi.setSessionSha(param, undefined);
        })
    }

    static auth(onSuccess: (result: {}) => void, onError: (reason: {}) => void) {
        const authenticator = new Authenticator({});
        authenticator.authenticate(
            { provider: "github", scope: "public_repo,repo" },
            async function (error, data) {
                if (error) {
                    onError(error);
                } else {
                    onSuccess(data);
                }
            }
        );
    }
}
