import Keycloak from "keycloak-js";
import {KaravanApi} from "./KaravanApi";

export class SsoApi {

    static keycloak?: Keycloak;

    static auth(after: () => void) {
        KaravanApi.getConfig((config: any) => {
            SsoApi.keycloak = new Keycloak({url: config.url, realm: 'karavan', clientId: 'karavan-frontend'});
            SsoApi.keycloak.init({onLoad: 'login-required', flow: 'hybrid'}).then(value => {
                console.log('SsoApi', 'User is now authenticated.');
                KaravanApi.isAuthorized = true;
                after();
            }).catch(reason => {
                console.log('SsoApi', 'Error:', reason);
                window.location.reload();
            });
        });
    }
}