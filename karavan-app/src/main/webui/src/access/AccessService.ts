import {AccessApi} from "./AccessApi";
import {useAccessStore} from "./AccessStore";

export class AccessService {

    public static refreshAccess() {
        AccessApi.getUsers(users => {
            useAccessStore.setState({users: users});
        })
        AccessApi.getRoles(roles => {
            useAccessStore.setState({roles: roles});
        })
    }
}