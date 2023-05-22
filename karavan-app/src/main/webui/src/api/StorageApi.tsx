// import {GithubParams} from "./GithubApiModal"

interface GithubParams {
    repoOwner: string
    userName: string
    commitMessage: string
    branch: string
    userEmail: string
    accessToken: string
    repoUri: string
}

export class StorageApi {

    // static getKey(parameters: GithubParams) {
    //     return parameters.owner + "/" + parameters.repo + "/" + parameters.path;
    // }

    // static setSessionSha(parameters: GithubParams, sha: string | undefined) {
    //     if (sha) window.sessionStorage.setItem(StorageApi.getKey(parameters), sha)
    //     else window.sessionStorage.removeItem(StorageApi.getKey(parameters));
    // }

    // static getSessionSha(parameters: GithubParams) {
    //     return window.sessionStorage.getItem(StorageApi.getKey(parameters));
    // }

    static setGithubParameters(parameters: GithubParams) {
        window.localStorage.setItem('githubParameters', JSON.stringify(parameters));
    }

    static getGithubParameters(): GithubParams | undefined {
        const param = window.localStorage.getItem('githubParameters');
        return param ? (JSON.parse(param) as GithubParams) : undefined;
    }
}
